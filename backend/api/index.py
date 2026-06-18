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
        CREATE TABLE IF NOT EXISTS app_users (
            id SERIAL PRIMARY KEY,
            username VARCHAR(100) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT NOW()
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
    # Начальные пользователи
    cur.execute("SELECT COUNT(*) AS c FROM app_users")
    if cur.fetchone()['c'] == 0:
        cur.execute("INSERT INTO app_users (username, password) VALUES ('n.slep', 'AzsxdcAzsxd1')")

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
            SELECT o.*,
                COALESCE((
                    SELECT SUM(sc.cost)
                    FROM stage_costs sc
                    WHERE sc.object_id = o.id
                      AND EXISTS (
                          SELECT 1 FROM inspections i
                          WHERE i.stage = sc.stage
                            AND i.stage_passed = 'Да'
                            AND (
                              i.object_name LIKE CONCAT(o.customer_last_name, '%')
                              OR i.object_name LIKE CONCAT(o.customer_last_name, ' ', COALESCE(o.customer_first_name, ''), '%')
                            )
                      )
                ), 0) AS actual_expenses
            FROM objects o
            ORDER BY
                CASE WHEN o.contract_sign_date IS NOT NULL THEN 0 ELSE 1 END,
                o.contract_sign_date ASC NULLS LAST,
                o.created_at ASC
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

    elif action == 'delete_object':
        oid = int(body.get('id'))
        # Получаем имя клиента для поиска связанных осмотров
        cur.execute(f"SELECT customer_last_name, customer_first_name, address FROM objects WHERE id={oid} LIMIT 1")
        nr = cur.fetchone()
        if nr:
            parts = [nr['customer_last_name'], nr['customer_first_name']]
            base_name = ' '.join(p for p in parts if p)
            # Удаляем закупки, связанные с осмотрами этого объекта
            cur.execute(f"""
                DELETE FROM purchases WHERE inspection_id IN (
                    SELECT id FROM inspections WHERE object_name LIKE {esc(base_name + '%')}
                )
            """)
            # Удаляем осмотры
            cur.execute(f"DELETE FROM inspections WHERE object_name LIKE {esc(base_name + '%')}")
        # Удаляем стоимости этапов
        cur.execute(f"DELETE FROM stage_costs WHERE object_id={oid}")
        # Удаляем сам объект
        cur.execute(f"DELETE FROM objects WHERE id={oid}")
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
        purchases = [jsonable(r) for r in cur.fetchall()]
        if purchases:
            ids = ','.join(str(p['id']) for p in purchases)
            cur.execute(f"SELECT * FROM purchase_amounts WHERE purchase_id IN ({ids}) AND supplier != '__deleted__' ORDER BY sort_order ASC, id ASC")
            amounts = cur.fetchall()
            amounts_map: dict = {}
            for a in amounts:
                apid = a['purchase_id']
                if apid not in amounts_map:
                    amounts_map[apid] = []
                amounts_map[apid].append({'id': a['id'], 'amount': float(a['amount'] or 0), 'supplier': a['supplier'] or ''})
            for pu in purchases:
                pu['amounts'] = amounts_map.get(pu['id'], [])
        result = {'purchases': purchases}

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

    elif action == 'save_purchase_amounts':
        pid = int(body.get('purchase_id'))
        amounts = body.get('amounts', [])
        # Сохраняем upsert по id; строки без id — новые
        cur.execute(f"SELECT id FROM purchase_amounts WHERE purchase_id={pid}")
        existing_ids = {r['id'] for r in cur.fetchall()}
        incoming_ids = set()
        for i, a in enumerate(amounts):
            amt = max(0, float(a.get('amount') or 0))
            supplier = str(a.get('supplier') or '')
            aid = a.get('id')
            if aid and int(aid) in existing_ids:
                aid = int(aid)
                incoming_ids.add(aid)
                cur.execute(f"UPDATE purchase_amounts SET amount={amt}, supplier={esc(supplier)}, sort_order={i} WHERE id={aid}")
            else:
                cur.execute(f"INSERT INTO purchase_amounts (purchase_id, amount, supplier, sort_order) VALUES ({pid}, {amt}, {esc(supplier)}, {i}) RETURNING id")
                incoming_ids.add(cur.fetchone()['id'])
        # Обнуляем удалённые строки (amount=0, supplier=deleted)
        for old_id in existing_ids - incoming_ids:
            cur.execute(f"UPDATE purchase_amounts SET amount=0, supplier='__deleted__', sort_order=9999 WHERE id={old_id}")
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

    # ── Пользователи (аутентификация) ─────────────────────────────────────────
    elif action == 'user_login':
        username = str(body.get('username', '')).strip()
        password = str(body.get('password', ''))
        cur.execute(f"SELECT id, username, is_admin, failed_attempts, first_failed_at, locked_until FROM app_users WHERE username={esc(username)} LIMIT 1")
        row = cur.fetchone()
        if not row:
            result = {'ok': False, 'error': 'Неверный логин или пароль'}
        else:
            from datetime import datetime, timezone, timedelta
            now = datetime.now(timezone.utc)
            locked_until = row['locked_until']
            # Проверяем активную блокировку
            if locked_until:
                if locked_until.tzinfo is None:
                    locked_until = locked_until.replace(tzinfo=timezone.utc)
                if now < locked_until:
                    remaining = int((locked_until - now).total_seconds() / 60)
                    result = {'ok': False, 'locked': True, 'error': f'Аккаунт заблокирован. Попробуйте через {remaining} мин.'}
                    cur.close(); conn.close()
                    return {'statusCode': 200, 'headers': CORS, 'body': json.dumps(result, ensure_ascii=False)}
                else:
                    # Блокировка истекла — сбрасываем
                    cur.execute(f"UPDATE app_users SET failed_attempts=0, first_failed_at=NULL, locked_until=NULL WHERE id={row['id']}")
                    row = dict(row); row['failed_attempts'] = 0; row['first_failed_at'] = None

            if row['password'] == password:
                # Успешный вход — сбрасываем счётчик
                cur.execute(f"UPDATE app_users SET failed_attempts=0, first_failed_at=NULL, locked_until=NULL WHERE id={row['id']}")
                result = {'ok': True, 'username': row['username'], 'is_admin': bool(row['is_admin'])}
            else:
                # Неверный пароль
                attempts = (row['failed_attempts'] or 0) + 1
                first_failed = row['first_failed_at']
                if first_failed and first_failed.tzinfo is None:
                    first_failed = first_failed.replace(tzinfo=timezone.utc)
                window = timedelta(minutes=15)
                # Сбрасываем окно если прошло больше 15 минут с первой ошибки
                if first_failed and (now - first_failed) > window:
                    attempts = 1
                    first_failed = now
                elif not first_failed:
                    first_failed = now
                if attempts >= 3:
                    locked_until_new = now + timedelta(hours=24)
                    cur.execute(f"UPDATE app_users SET failed_attempts={attempts}, first_failed_at='{first_failed.isoformat()}', locked_until='{locked_until_new.isoformat()}' WHERE id={row['id']}")
                    result = {'ok': False, 'locked': True, 'error': 'Аккаунт заблокирован на 24 часа после 3 неверных попыток.'}
                else:
                    cur.execute(f"UPDATE app_users SET failed_attempts={attempts}, first_failed_at='{first_failed.isoformat()}' WHERE id={row['id']}")
                    left = 3 - attempts
                    result = {'ok': False, 'error': f'Неверный логин или пароль. Осталось попыток: {left}'}

    elif action == 'list_users':
        cur.execute("SELECT id, username, is_admin, locked_until, failed_attempts, created_at FROM app_users ORDER BY created_at ASC")
        from datetime import datetime, timezone
        now = datetime.now(timezone.utc)
        users_out = []
        for u in cur.fetchall():
            d = jsonable(u)
            lu = u['locked_until']
            if lu:
                if lu.tzinfo is None:
                    lu = lu.replace(tzinfo=timezone.utc)
                d['is_locked'] = now < lu
                d['locked_until_iso'] = lu.isoformat()
            else:
                d['is_locked'] = False
                d['locked_until_iso'] = None
            users_out.append(d)
        result = {'users': users_out}

    elif action == 'add_user':
        username = str(body.get('username', '')).strip()
        password = str(body.get('password', ''))
        if not username or not password:
            result = {'ok': False, 'error': 'Логин и пароль обязательны'}
        else:
            cur.execute(f"SELECT id FROM app_users WHERE username={esc(username)} LIMIT 1")
            if cur.fetchone():
                result = {'ok': False, 'error': 'Логин уже занят'}
            else:
                cur.execute(f"INSERT INTO app_users (username, password) VALUES ({esc(username)}, {esc(password)})")
                result = {'ok': True}

    elif action == 'change_user_password':
        uid = int(body.get('id'))
        password = str(body.get('password', ''))
        if not password:
            result = {'ok': False, 'error': 'Пароль не может быть пустым'}
        else:
            cur.execute(f"UPDATE app_users SET password={esc(password)} WHERE id={uid}")
            result = {'ok': True}

    elif action == 'toggle_admin':
        uid = int(body.get('id'))
        cur.execute(f"UPDATE app_users SET is_admin = NOT is_admin WHERE id={uid} RETURNING is_admin")
        row = cur.fetchone()
        result = {'ok': True, 'is_admin': bool(row['is_admin']) if row else False}

    elif action == 'unlock_user':
        uid = int(body.get('id'))
        cur.execute(f"UPDATE app_users SET failed_attempts=0, first_failed_at=NULL, locked_until=NULL WHERE id={uid}")
        result = {'ok': True}

    elif action == 'delete_user':
        uid = int(body.get('id'))
        cur.execute(f"DELETE FROM app_users WHERE id={uid}")
        result = {'ok': True}

    else:
        cur.close()
        conn.close()
        return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'unknown action'})}

    cur.close()
    conn.close()
    return {'statusCode': 200, 'headers': CORS, 'body': json.dumps(result, ensure_ascii=False)}