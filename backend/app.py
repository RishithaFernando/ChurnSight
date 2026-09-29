from flask import Flask, request, jsonify, session
from flask_cors import CORS
import psycopg2
import psycopg2.extras
import bcrypt
import joblib
import shap
import pandas as pd
import numpy as np
import json
import uuid
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')

app = Flask(__name__)
app.secret_key = 'churnsight_secret_key_2026'
CORS(app, supports_credentials=True)

# Database connection
def get_db():
    return psycopg2.connect(
        host='localhost',
        port=5432,
        database='churnsight',
        user='postgres',
        password='rishitha'
    )

# Load ML artifacts once at startup
print("Loading model and artifacts...")
model = joblib.load('../churnsight_artifacts/xgb_model.pkl')
scaler = joblib.load('../churnsight_artifacts/scaler.pkl')
feature_cols = joblib.load('../churnsight_artifacts/feature_cols.pkl')
explainer = shap.TreeExplainer(model)
print("All artifacts loaded.")

scale_cols = [
    'Age', 'Number of Dependents', 'Number of Referrals',
    'Tenure in Months', 'Avg Monthly Long Distance Charges',
    'Avg Monthly GB Download', 'Monthly Charge', 'Total Charges',
    'Total Refunds', 'Total Extra Data Charges',
    'Total Long Distance Charges', 'Satisfaction Score'
]

def get_recommendation(risk_level):
    if risk_level == 'High':
        return 'Immediate retention action required. Contact this customer within 24 hours and offer a personalised retention deal.'
    elif risk_level == 'Medium':
        return 'Monitor closely. Consider reaching out within the week with a personalised offer or service upgrade.'
    else:
        return 'No immediate action needed. Continue standard engagement and monitor monthly.'

def get_impact_level(shap_value):
    abs_val = abs(shap_value)
    if abs_val >= 1.0:
        return 'High'
    elif abs_val >= 0.3:
        return 'Medium'
    else:
        return 'Low'

def run_prediction(data):
    input_data = {
        'Gender': data.get('gender', 0),
        'Age': data.get('age', 0),
        'Under 30': 1 if data.get('age', 0) < 30 else 0,
        'Senior Citizen': data.get('senior_citizen', 0),
        'Married': data.get('married', 0),
        'Dependents': data.get('dependents', 0),
        'Number of Dependents': data.get('number_of_dependents', 0),
        'Referred a Friend': data.get('referred_a_friend', 0),
        'Number of Referrals': data.get('number_of_referrals', 0),
        'Tenure in Months': data.get('tenure_in_months', 0),
        'Phone Service': data.get('phone_service', 0),
        'Avg Monthly Long Distance Charges': data.get('avg_monthly_long_distance_charges', 0),
        'Multiple Lines': data.get('multiple_lines', 0),
        'Internet Service': data.get('internet_service', 0),
        'Avg Monthly GB Download': data.get('avg_monthly_gb_download', 0),
        'Online Security': data.get('online_security', 0),
        'Online Backup': data.get('online_backup', 0),
        'Device Protection Plan': data.get('device_protection_plan', 0),
        'Premium Tech Support': data.get('premium_tech_support', 0),
        'Streaming TV': data.get('streaming_tv', 0),
        'Streaming Movies': data.get('streaming_movies', 0),
        'Streaming Music': data.get('streaming_music', 0),
        'Unlimited Data': data.get('unlimited_data', 0),
        'Contract': data.get('contract', 0),
        'Paperless Billing': data.get('paperless_billing', 0),
        'Monthly Charge': data.get('monthly_charge', 0),
        'Total Charges': data.get('total_charges', 0),
        'Total Refunds': data.get('total_refunds', 0),
        'Total Extra Data Charges': data.get('total_extra_data_charges', 0),
        'Total Long Distance Charges': data.get('total_long_distance_charges', 0),
        'Satisfaction Score': data.get('satisfaction_score', 0),
        'Offer_No Offer': 1 if data.get('offer') == 'No Offer' else 0,
        'Offer_Offer A': 1 if data.get('offer') == 'Offer A' else 0,
        'Offer_Offer B': 1 if data.get('offer') == 'Offer B' else 0,
        'Offer_Offer C': 1 if data.get('offer') == 'Offer C' else 0,
        'Offer_Offer D': 1 if data.get('offer') == 'Offer D' else 0,
        'Offer_Offer E': 1 if data.get('offer') == 'Offer E' else 0,
        'Internet Type_Cable': 1 if data.get('internet_type') == 'Cable' else 0,
        'Internet Type_DSL': 1 if data.get('internet_type') == 'DSL' else 0,
        'Internet Type_Fiber Optic': 1 if data.get('internet_type') == 'Fiber Optic' else 0,
        'Internet Type_No Internet': 1 if data.get('internet_type') == 'No Internet' else 0,
        'Payment Method_Bank Withdrawal': 1 if data.get('payment_method') == 'Bank Withdrawal' else 0,
        'Payment Method_Credit Card': 1 if data.get('payment_method') == 'Credit Card' else 0,
        'Payment Method_Mailed Check': 1 if data.get('payment_method') == 'Mailed Check' else 0,
    }

    input_df = pd.DataFrame([input_data])[feature_cols]
    input_df[scale_cols] = scaler.transform(input_df[scale_cols])

    prediction = int(model.predict(input_df)[0])
    probability = float(model.predict_proba(input_df)[0][1])
    risk_level = 'High' if probability >= 0.7 else 'Medium' if probability >= 0.4 else 'Low'

    shap_values = explainer.shap_values(input_df)
    shap_dict = dict(zip(feature_cols, shap_values[0].tolist()))

    top_factors = sorted(
        [{'factor': k,
          'shap_value': round(v, 4),
          'direction': 'Increases Risk' if v > 0 else 'Decreases Risk',
          'impact': get_impact_level(v)}
         for k, v in shap_dict.items()],
        key=lambda x: abs(x['shap_value']),
        reverse=True
    )[:5]

    return {
        'prediction': prediction,
        'probability': round(probability * 100, 2),
        'risk_level': risk_level,
        'recommendation': get_recommendation(risk_level),
        'shap_values': shap_dict,
        'top_factors': top_factors
    }

# ─── Health Check ────────────────────────────────────────
@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'message': 'ChurnSight API running'})

# ─── Admin Auth ──────────────────────────────────────────
@app.route('/admin/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    if not username or not email or not password:
        return jsonify({'error': 'All fields required'}), 400

    password_hash = bcrypt.hashpw(
        password.encode('utf-8'),
        bcrypt.gensalt()
    ).decode('utf-8')

    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute(
            'INSERT INTO admins (username, email, password_hash) VALUES (%s, %s, %s)',
            (username, email, password_hash)
        )
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({'message': 'Admin registered successfully'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/admin/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    try:
        conn = get_db()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute('SELECT * FROM admins WHERE username = %s', (username,))
        admin = cur.fetchone()
        cur.close()
        conn.close()

        if not admin:
            return jsonify({'error': 'Invalid credentials'}), 401

        if bcrypt.checkpw(password.encode('utf-8'),
                          admin['password_hash'].encode('utf-8')):
            session['admin_id'] = admin['id']
            session['admin_username'] = admin['username']
            return jsonify({
                'message': 'Login successful',
                'username': admin['username']
            }), 200
        else:
            return jsonify({'error': 'Invalid credentials'}), 401
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/admin/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'message': 'Logged out successfully'}), 200

@app.route('/admin/check', methods=['GET'])
def check_auth():
    if 'admin_id' in session:
        return jsonify({
            'authenticated': True,
            'username': session['admin_username']
        }), 200
    return jsonify({'authenticated': False}), 401

# ─── Campaign Management ─────────────────────────────────
@app.route('/admin/campaigns', methods=['GET'])
def get_campaigns():
    if 'admin_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    try:
        conn = get_db()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute('''
            SELECT 
                c.id, c.name, c.description, c.survey_token,
                c.created_at, c.is_active,
                COUNT(cu.id) as total_customers,
                SUM(CASE WHEN p.risk_level = 'High' THEN 1 ELSE 0 END) as high_risk,
                SUM(CASE WHEN p.risk_level = 'Medium' THEN 1 ELSE 0 END) as medium_risk,
                SUM(CASE WHEN p.risk_level = 'Low' THEN 1 ELSE 0 END) as low_risk
            FROM campaigns c
            LEFT JOIN customers cu ON c.id = cu.campaign_id
            LEFT JOIN predictions p ON cu.id = p.customer_id
            GROUP BY c.id
            ORDER BY c.created_at DESC
        ''')
        campaigns = cur.fetchall()
        cur.close()
        conn.close()
        return jsonify([dict(c) for c in campaigns]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/admin/campaign/create', methods=['POST'])
def create_campaign():
    if 'admin_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    data = request.get_json()
    name = data.get('name')
    description = data.get('description', '')

    if not name:
        return jsonify({'error': 'Campaign name is required'}), 400

    survey_token = str(uuid.uuid4())[:8]

    try:
        conn = get_db()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute('''
            INSERT INTO campaigns (name, description, survey_token)
            VALUES (%s, %s, %s) RETURNING *
        ''', (name, description, survey_token))
        campaign = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        return jsonify(dict(campaign)), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/admin/campaign/<int:campaign_id>', methods=['GET'])
def get_campaign(campaign_id):
    if 'admin_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    try:
        conn = get_db()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute('SELECT * FROM campaigns WHERE id = %s', (campaign_id,))
        campaign = cur.fetchone()
        cur.execute('''
            SELECT c.id, c.name, c.email, c.submitted_at,
                   p.prediction, p.probability, p.risk_level
            FROM customers c
            LEFT JOIN predictions p ON c.id = p.customer_id
            WHERE c.campaign_id = %s
            ORDER BY c.submitted_at DESC
        ''', (campaign_id,))
        customers = cur.fetchall()
        cur.close()
        conn.close()
        if not campaign:
            return jsonify({'error': 'Campaign not found'}), 404
        return jsonify({
            'campaign': dict(campaign),
            'customers': [dict(c) for c in customers]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/admin/campaign/<int:campaign_id>/toggle', methods=['POST'])
def toggle_campaign(campaign_id):
    if 'admin_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    try:
        conn = get_db()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute('''
            UPDATE campaigns SET is_active = NOT is_active
            WHERE id = %s RETURNING *
        ''', (campaign_id,))
        campaign = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        return jsonify(dict(campaign)), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ─── Survey Token Validation ─────────────────────────────
@app.route('/survey/validate/<token>', methods=['GET'])
def validate_survey(token):
    try:
        conn = get_db()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute(
            'SELECT * FROM campaigns WHERE survey_token = %s',
            (token,)
        )
        campaign = cur.fetchone()
        cur.close()
        conn.close()

        if not campaign:
            return jsonify({'error': 'Invalid survey link'}), 404
        if not campaign['is_active']:
            return jsonify({'error': 'This survey is no longer active'}), 403

        return jsonify({
            'valid': True,
            'campaign_id': campaign['id'],
            'campaign_name': campaign['name']
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ─── Survey Submission ───────────────────────────────────
@app.route('/survey/submit', methods=['POST'])
def submit_survey():
    data = request.get_json()
    campaign_id = data.get('campaign_id')

    if not campaign_id:
        return jsonify({'error': 'Campaign ID is required'}), 400

    try:
        conn = get_db()
        cur = conn.cursor()

        cur.execute('''
            INSERT INTO customers (
                name, email, gender, age, senior_citizen, married,
                dependents, number_of_dependents, referred_a_friend,
                number_of_referrals, tenure_in_months, offer,
                phone_service, avg_monthly_long_distance_charges,
                multiple_lines, internet_service, internet_type,
                avg_monthly_gb_download, online_security, online_backup,
                device_protection_plan, premium_tech_support,
                streaming_tv, streaming_movies, streaming_music,
                unlimited_data, contract, paperless_billing,
                payment_method, monthly_charge, total_charges,
                total_refunds, total_extra_data_charges,
                total_long_distance_charges, satisfaction_score,
                campaign_id
            ) VALUES (
                %s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,
                %s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s
            ) RETURNING id
        ''', (
            data['name'], data['email'], data['gender'], data['age'],
            data['senior_citizen'], data['married'], data['dependents'],
            data['number_of_dependents'], data['referred_a_friend'],
            data['number_of_referrals'], data['tenure_in_months'],
            data['offer'], data['phone_service'],
            data['avg_monthly_long_distance_charges'],
            data['multiple_lines'], data['internet_service'],
            data['internet_type'], data['avg_monthly_gb_download'],
            data['online_security'], data['online_backup'],
            data['device_protection_plan'], data['premium_tech_support'],
            data['streaming_tv'], data['streaming_movies'],
            data['streaming_music'], data['unlimited_data'],
            data['contract'], data['paperless_billing'],
            data['payment_method'], data['monthly_charge'],
            data['total_charges'], data['total_refunds'],
            data['total_extra_data_charges'],
            data['total_long_distance_charges'],
            data['satisfaction_score'], campaign_id
        ))

        customer_id = cur.fetchone()[0]
        prediction_result = run_prediction(data)

        cur.execute('''
            INSERT INTO predictions (
                customer_id, prediction, probability, risk_level,
                recommendation, shap_values, top_factors
            ) VALUES (%s,%s,%s,%s,%s,%s,%s)
        ''', (
            customer_id,
            prediction_result['prediction'],
            prediction_result['probability'],
            prediction_result['risk_level'],
            prediction_result['recommendation'],
            json.dumps(prediction_result['shap_values']),
            json.dumps(prediction_result['top_factors'])
        ))

        conn.commit()
        cur.close()
        conn.close()

        return jsonify({
            'message': 'Survey submitted successfully',
            'customer_id': customer_id
        }), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ─── Admin Dashboard ─────────────────────────────────────
@app.route('/admin/dashboard/stats', methods=['GET'])
def dashboard_stats():
    if 'admin_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    try:
        conn = get_db()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute('SELECT COUNT(*) as total FROM campaigns')
        total_campaigns = cur.fetchone()['total']
        cur.execute('SELECT COUNT(*) as total FROM customers')
        total_customers = cur.fetchone()['total']
        cur.execute("SELECT COUNT(*) as high FROM predictions WHERE risk_level='High'")
        high = cur.fetchone()['high']
        cur.execute("SELECT COUNT(*) as medium FROM predictions WHERE risk_level='Medium'")
        medium = cur.fetchone()['medium']
        cur.execute("SELECT COUNT(*) as low FROM predictions WHERE risk_level='Low'")
        low = cur.fetchone()['low']
        cur.close()
        conn.close()
        return jsonify({
            'total_campaigns': total_campaigns,
            'total_customers': total_customers,
            'high_risk': high,
            'medium_risk': medium,
            'low_risk': low
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/admin/customers', methods=['GET'])
def get_customers():
    if 'admin_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    try:
        conn = get_db()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute('''
            SELECT 
                c.id, c.name, c.email, c.submitted_at,
                c.campaign_id, c.contract, c.satisfaction_score,
                camp.name as campaign_name,
                p.prediction, p.probability, p.risk_level
            FROM customers c
            LEFT JOIN predictions p ON c.id = p.customer_id
            LEFT JOIN campaigns camp ON c.campaign_id = camp.id
            ORDER BY c.submitted_at DESC
        ''')
        customers = cur.fetchall()
        cur.close()
        conn.close()
        return jsonify([dict(c) for c in customers]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/admin/customer/<int:customer_id>', methods=['GET'])
def get_customer(customer_id):
    if 'admin_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    try:
        conn = get_db()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute('SELECT * FROM customers WHERE id = %s', (customer_id,))
        customer = cur.fetchone()
        cur.execute(
            'SELECT * FROM predictions WHERE customer_id = %s',
            (customer_id,)
        )
        prediction = cur.fetchone()
        cur.close()
        conn.close()
        if not customer:
            return jsonify({'error': 'Customer not found'}), 404
        return jsonify({
            'customer': dict(customer),
            'prediction': dict(prediction) if prediction else None
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)