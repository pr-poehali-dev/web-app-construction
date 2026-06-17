import json
import os
from decimal import Decimal
from datetime import date, datetime

import psycopg2
import psycopg2.extras

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token, X-Session-Id',
    'Access-Control-Max-Age': '86400',
    'Content-Type': 'application/json',
}


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def ensure_schema(cur):
    cur.execute('''
        CREATE TABLE IF NOT EXISTS objects (
            id SERIAL PRIMARY KEY,
            customer_last_name VARCHAR(255) NOT NULL,
            customer_first_name VARCHAR(255),
            customer_middle_name VARCHAR(255),
            customer_phone VARCHAR(50),
            customer_email VARCHAR(255),
            project VARCHAR(255),
            area_living NUMERIC(10,2),
            area_total NUMERIC(10,2),
            address TEXT,
            cadastral_number VARCHAR(100),
            contract_prelim_number VARCHAR(100),
            contract_main_number VARCHAR(100),
            contract_sign_date DATE,
            contract_end_date DATE,
            cost NUMERIC(14,2) DEFAULT 0,
            self_cost NUMERIC(14,2) DEFAULT 0,
            mortgage_cost NUMERIC(14,2) DEFAULT 0,
            bank VARCHAR(255),
            note TEXT,
            created_at TIMESTAMP DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS inspections (
            id SERIAL PRIMARY KEY,
            object_id INTEGER,
            object_name VARCHAR(255),
            stage VARCHAR(255),
            stage_passed VARCHAR(20),
            delivery_date DATE,
            supply VARCHAR(255),
            next_start_date DATE,
            next_end_date DATE,
            note TEXT,
            house_done VARCHAR(100),
            owner_meeting_date DATE,
            act_date DATE,
            created_at TIMESTAMP DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS purchases (
            id SERIAL PRIMARY KEY,
            inspection_id INTEGER,
            object_name VARCHAR(255),
            supply VARCHAR(255),
            delivery_date DATE,
            status VARCHAR(30) DEFAULT 'new',
            payment_date DATE,
            created_at TIMESTAMP DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS settings (
            id SERIAL PRIMARY KEY,
            kind VARCHAR(50) NOT NULL,
            value VARCHAR(500) NOT NULL,
            sort_order INTEGER DEFAULT 0
        );
        CREATE TABLE IF NOT EXISTS stage_costs (
            id SERIAL PRIMARY KEY,
            object_id INTEGER NOT NULL,
            stage VARCHAR(255) NOT NULL,
            cost NUMERIC(14,2) DEFAULT 0,
            UNIQUE(object_id, stage)
        );
    ''')
    # Добавляем новые колонки к существующим таблицам (безопасно)
    for col_sql in [
        "ALTER TABLE objects ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255)",
        "ALTER TABLE objects ADD COLUMN IF NOT EXISTS area_living NUMERIC(10,2)",
        "ALTER TABLE objects ADD COLUMN IF NOT EXISTS area_total NUMERIC(10,2)",
        "ALTER TABLE objects ADD COLUMN IF NOT EXISTS cadastral_number VARCHAR(100)",
        "ALTER TABLE objects ADD COLUMN IF NOT EXISTS contract_prelim_number VARCHAR(100)",
        "ALTER TABLE objects ADD COLUMN IF NOT EXISTS contract_main_number VARCHAR(100)",
    ]:
        cur.execute(col_sql)

    cur.execute("SELECT COUNT(*) AS c FROM settings")
    if cur.fetchone()['c'] == 0:
        stages = ['Фундамент', 'Стены', 'Армопояс', 'Кровля', 'Фасад', 'Цоколь',
                  'Контур заземления', 'Отмостка', 'Окна и дверь', 'Вентиляция',
                  'Сантехника', 'Электроснабжение',
                  'Стяжка полусухая и улучшенная штукатурка стен', 'Дом сдан']
        for i, s in enumerate(stages):
            v = s.replace("'", "''")
            cur.execute(f"INSERT INTO settings (kind, value, sort_order) VALUES ('stage', '{v}', {i + 1})")
        supplies = ['Бетон на армопояс', 'Комплект стен', 'Комплект для крыши']
        for i, s in enumerate(supplies):
            v = s.replace("'", "''")
            cur.execute(f"INSERT INTO settings (kind, value, sort_order) VALUES ('supply', '{v}', {i + 1})")
        cur.execute("INSERT INTO settings (kind, value, sort_order) VALUES ('admin_password', '80005001', 0)")
        cur.execute("INSERT INTO settings (kind, value, sort_order) VALUES ('admin_password_changed', 'false', 0)")


def jsonable(row):
    out = {}
    for k, v in row.items():
        if isinstance(v, Decimal):
            out[k] = float(v)
        elif isinstance(v, (date, datetime)):
            out[k] = v.isoformat()
        else:
            out[k] = v
    return out


def esc(v):
    if v is None or v == '':
        return 'NULL'
    return "'" + str(v).replace("'", "''") + "'"


def num(v):
    if v is None or v == '':
        return '0'
    try:
        return str(float(v))
    except (ValueError, TypeError):
        return '0'


def handler(event, context):
    '''Бэкенд СтройКонтроль: объекты, осмотры, закупки, настройки, этапы'''
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    params = event.get('queryStringParameters') or {}
    action = params.get('action', '')
    body = {}
    if event.get('body'):
        try:
            body = json.loads(event['body'])
        except (ValueError, TypeError):
            body = {}
    if not action:
        action = body.get('action', '')

    conn = get_conn()
    conn.autocommit = True
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    ensure_schema(cur)

    result = {}

    # ── Объекты ──────────────────────────────────────────────────────────────
    if action == 'list_objects':
        cur.execute("""
            SELECT * FROM objects
            ORDER BY
                CASE WHEN contract_sign_date IS NOT NULL THEN 0 ELSE 1 END,
                contract_sign_date ASC NULLS LAST,
                created_at ASC
        """)
        result = {'objects': [jsonable(r) for r in cur.fetchall()]}

    elif action == 'add_object':
        cur.execute(f'''INSERT INTO objects
            (customer_last_name, customer_first_name, customer_middle_name,
             customer_phone, customer_email,
             project, area_living, area_total, address, cadastral_number,
             contract_prelim_number, contract_main_number,
             contract_sign_date, contract_end_date,
             cost, self_cost, mortgage_cost, bank, note)
            VALUES (
             {esc(body.get('customer_last_name'))},
             {esc(body.get('customer_first_name'))},
             {esc(body.get('customer_middle_name'))},
             {esc(body.get('customer_phone'))},
             {esc(body.get('customer_email'))},
             {esc(body.get('project'))},
             {num(body.get('area_living'))},
             {num(body.get('area_total'))},
             {esc(body.get('address'))},
             {esc(body.get('cadastral_number'))},
             {esc(body.get('contract_prelim_number'))},
             {esc(body.get('contract_main_number'))},
             {esc(body.get('contract_sign_date'))},
             {esc(body.get('contract_end_date'))},
             {num(body.get('cost'))},
             {num(body.get('self_cost'))},
             {num(body.get('mortgage_cost'))},
             {esc(body.get('bank'))},
             {esc(body.get('note'))})
            RETURNING id''')
        result = {'id': cur.fetchone()['id']}

    elif action == 'update_object':
        oid = int(body.get('id'))
        cur.execute(f'''UPDATE objects SET
            customer_last_name={esc(body.get('customer_last_name'))},
            customer_first_name={esc(body.get('customer_first_name'))},
            customer_middle_name={esc(body.get('customer_middle_name'))},
            customer_phone={esc(body.get('customer_phone'))},
            customer_email={esc(body.get('customer_email'))},
            project={esc(body.get('project'))},
            area_living={num(body.get('area_living'))},
            area_total={num(body.get('area_total'))},
            address={esc(body.get('address'))},
            cadastral_number={esc(body.get('cadastral_number'))},
            contract_prelim_number={esc(body.get('contract_prelim_number'))},
            contract_main_number={esc(body.get('contract_main_number'))},
            contract_sign_date={esc(body.get('contract_sign_date'))},
            contract_end_date={esc(body.get('contract_end_date'))},
            cost={num(body.get('cost'))},
            self_cost={num(body.get('self_cost'))},
            mortgage_cost={num(body.get('mortgage_cost'))},
            bank={esc(body.get('bank'))},
            note={esc(body.get('note'))}
            WHERE id={oid}''')
        result = {'ok': True}

    # ── Получение последнего принятого этапа объекта ─────────────────────────
    elif action == 'get_last_stage':
        obj_name = body.get('object_name') or params.get('object_name', '')
        if obj_name:
            cur.execute(f"""
                SELECT stage, stage_passed FROM inspections
                WHERE object_name = {esc(obj_name)}
                ORDER BY created_at DESC LIMIT 1
            """)
            row = cur.fetchone()
            result = {
                'stage': row['stage'] if row else None,
                'stage_passed': row['stage_passed'] if row else None
            }
        else:
            result = {'stage': None, 'stage_passed': None}

    # ── Осмотры ───────────────────────────────────────────────────────────────
    elif action == 'list_inspections':
        cur.execute("SELECT * FROM inspections ORDER BY created_at DESC")
        result = {'inspections': [jsonable(r) for r in cur.fetchall()]}

    elif action == 'add_inspection':
        cur.execute(f'''INSERT INTO inspections
            (object_name, stage, stage_passed, delivery_date, supply, next_start_date,
             next_end_date, note, house_done, owner_meeting_date, act_date)
            VALUES ({esc(body.get('object_name'))}, {esc(body.get('stage'))},
             {esc(body.get('stage_passed'))}, {esc(body.get('delivery_date'))},
             {esc(body.get('supply'))}, {esc(body.get('next_start_date'))},
             {esc(body.get('next_end_date'))}, {esc(body.get('note'))},
             {esc(body.get('house_done'))}, {esc(body.get('owner_meeting_date'))},
             {esc(body.get('act_date'))})
            RETURNING id''')
        ins_id = cur.fetchone()['id']

        if body.get('supply') and body.get('delivery_date'):
            cur.execute(f'''INSERT INTO purchases (inspection_id, object_name, supply, delivery_date, status)
                VALUES ({ins_id}, {esc(body.get('object_name'))}, {esc(body.get('supply'))},
                {esc(body.get('delivery_date'))}, 'new')''')

        if body.get('stage_passed') == 'Да' and body.get('object_name') and body.get('stage'):
            stage = body.get('stage')
            cur.execute(f"""
                SELECT sc.cost, sc.object_id FROM stage_costs sc
                WHERE sc.stage = {esc(stage)}
                ORDER BY sc.id DESC LIMIT 1
            """)
            sc_row = cur.fetchone()
            if sc_row and sc_row['cost'] and float(sc_row['cost']) > 0:
                cur.execute(f"""
                    UPDATE objects SET self_cost = GREATEST(0, self_cost - {float(sc_row['cost'])})
                    WHERE id = {sc_row['object_id']}
                """)

        result = {'id': ins_id}

    # ── Закупки ───────────────────────────────────────────────────────────────
    elif action == 'list_purchases':
        cur.execute("SELECT * FROM purchases WHERE delivery_date >= CURRENT_DATE ORDER BY delivery_date ASC")
        result = {'purchases': [jsonable(r) for r in cur.fetchall()]}

    elif action == 'update_purchase':
        pid = int(body.get('id'))
        sets = []
        if 'status' in body:
            sets.append(f"status={esc(body.get('status'))}")
        if 'payment_date' in body:
            sets.append(f"payment_date={esc(body.get('payment_date'))}")
        if sets:
            cur.execute(f"UPDATE purchases SET {', '.join(sets)} WHERE id={pid}")
        result = {'ok': True}

    # ── Стоимости этапов ──────────────────────────────────────────────────────
    elif action == 'get_stage_costs':
        oid = int(body.get('object_id') or params.get('object_id', 0))
        cur.execute(f"SELECT stage, cost FROM stage_costs WHERE object_id={oid}")
        costs = {r['stage']: float(r['cost']) for r in cur.fetchall()}
        result = {'costs': costs}

    elif action == 'set_stage_cost':
        oid = int(body.get('object_id'))
        stage = body.get('stage')
        cost_val = num(body.get('cost'))
        cur.execute(f"""
            INSERT INTO stage_costs (object_id, stage, cost) VALUES ({oid}, {esc(stage)}, {cost_val})
            ON CONFLICT (object_id, stage) DO UPDATE SET cost = EXCLUDED.cost
        """)
        result = {'ok': True}

    # ── Настройки ─────────────────────────────────────────────────────────────
    elif action == 'get_settings':
        cur.execute("SELECT * FROM settings ORDER BY kind, sort_order")
        rows = [jsonable(r) for r in cur.fetchall()]
        stages = [r['value'] for r in rows if r['kind'] == 'stage']
        supplies = [r['value'] for r in rows if r['kind'] == 'supply']
        changed = next((r['value'] for r in rows if r['kind'] == 'admin_password_changed'), 'false')
        result = {'stages': stages, 'supplies': supplies, 'password_changed': changed == 'true'}

    elif action == 'check_password':
        cur.execute("SELECT value FROM settings WHERE kind='admin_password' LIMIT 1")
        row = cur.fetchone()
        cur.execute("SELECT value FROM settings WHERE kind='admin_password_changed' LIMIT 1")
        ch = cur.fetchone()
        ok = row and row['value'] == str(body.get('password', ''))
        result = {'ok': ok, 'password_changed': (ch and ch['value'] == 'true')}

    elif action == 'change_password':
        cur.execute("SELECT value FROM settings WHERE kind='admin_password' LIMIT 1")
        row = cur.fetchone()
        if row and row['value'] == str(body.get('old_password', '')):
            cur.execute(f"UPDATE settings SET value={esc(body.get('new_password'))} WHERE kind='admin_password'")
            cur.execute("UPDATE settings SET value='true' WHERE kind='admin_password_changed'")
            result = {'ok': True}
        else:
            result = {'ok': False, 'error': 'Неверный текущий пароль'}

    elif action == 'set_list':
        kind = body.get('kind')
        items = body.get('items', [])
        if kind in ('stage', 'supply'):
            cur.execute(f"DELETE FROM settings WHERE kind='{kind}'")
            for i, it in enumerate(items):
                cur.execute(f"INSERT INTO settings (kind, value, sort_order) VALUES ('{kind}', {esc(it)}, {i + 1})")
        result = {'ok': True}

    else:
        cur.close()
        conn.close()
        return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'unknown action'})}

    cur.close()
    conn.close()
    return {'statusCode': 200, 'headers': CORS, 'body': json.dumps(result, ensure_ascii=False)}
