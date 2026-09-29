import psycopg2
import random
import json
import joblib
import shap
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import warnings
warnings.filterwarnings('ignore')

# Database connection
conn = psycopg2.connect(
    host='localhost',
    port=5432,
    database='churnsight',
    user='postgres',
    password='rishitha'
)
cur = conn.cursor()
print("Connected to database.")

# Load ML artifacts
print("Loading model...")
model = joblib.load('churnsight_artifacts/xgb_model.pkl')
scaler = joblib.load('churnsight_artifacts/scaler.pkl')
feature_cols = joblib.load('churnsight_artifacts/feature_cols.pkl')
explainer = shap.TreeExplainer(model)
print("Model loaded.")

scale_cols = [
    'Age', 'Number of Dependents', 'Number of Referrals',
    'Tenure in Months', 'Avg Monthly Long Distance Charges',
    'Avg Monthly GB Download', 'Monthly Charge', 'Total Charges',
    'Total Refunds', 'Total Extra Data Charges',
    'Total Long Distance Charges', 'Satisfaction Score'
]

def random_date(start_str, end_str):
    start = datetime.strptime(start_str, '%Y-%m-%d')
    end = datetime.strptime(end_str, '%Y-%m-%d')
    delta = end - start
    return start + timedelta(days=random.randint(0, delta.days))

def generate_medium_risk_profile():
    monthly_charge = random.uniform(60, 85)
    tenure = random.randint(6, 18)
    return {
        'gender': random.choice([0, 1]),
        'age': random.randint(35, 60),
        'senior_citizen': 0,
        'married': random.choice([0, 1]),
        'dependents': random.choice([0, 1]),
        'number_of_dependents': random.choice([0, 1]),
        'referred_a_friend': 0,
        'number_of_referrals': 0,
        'tenure_in_months': tenure,
        'offer': random.choice(['No Offer', 'Offer D', 'Offer C']),
        'phone_service': 1,
        'avg_monthly_long_distance_charges': random.uniform(10, 30),
        'multiple_lines': random.choice([0, 1]),
        'internet_service': 1,
        'internet_type': random.choice(['Cable', 'DSL']),
        'avg_monthly_gb_download': random.randint(10, 40),
        'online_security': 0,
        'online_backup': random.choice([0, 1]),
        'device_protection_plan': random.choice([0, 1]),
        'premium_tech_support': 0,
        'streaming_tv': random.choice([0, 1]),
        'streaming_movies': random.choice([0, 1]),
        'streaming_music': 0,
        'unlimited_data': random.choice([0, 1]),
        'contract': 0,
        'paperless_billing': 1,
        'payment_method': 'Bank Withdrawal',
        'monthly_charge': monthly_charge,
        'total_charges': round(monthly_charge * tenure, 2),
        'total_refunds': 0.0,
        'total_extra_data_charges': 0,
        'total_long_distance_charges': random.uniform(50, 150),
        'satisfaction_score': 3,
    }

def run_prediction(data, age):
    input_data = {
        'Gender': data['gender'],
        'Age': age,
        'Under 30': 1 if age < 30 else 0,
        'Senior Citizen': data['senior_citizen'],
        'Married': data['married'],
        'Dependents': data['dependents'],
        'Number of Dependents': data['number_of_dependents'],
        'Referred a Friend': data['referred_a_friend'],
        'Number of Referrals': data['number_of_referrals'],
        'Tenure in Months': data['tenure_in_months'],
        'Phone Service': data['phone_service'],
        'Avg Monthly Long Distance Charges': data['avg_monthly_long_distance_charges'],
        'Multiple Lines': data['multiple_lines'],
        'Internet Service': data['internet_service'],
        'Avg Monthly GB Download': data['avg_monthly_gb_download'],
        'Online Security': data['online_security'],
        'Online Backup': data['online_backup'],
        'Device Protection Plan': data['device_protection_plan'],
        'Premium Tech Support': data['premium_tech_support'],
        'Streaming TV': data['streaming_tv'],
        'Streaming Movies': data['streaming_movies'],
        'Streaming Music': data['streaming_music'],
        'Unlimited Data': data['unlimited_data'],
        'Contract': data['contract'],
        'Paperless Billing': data['paperless_billing'],
        'Monthly Charge': data['monthly_charge'],
        'Total Charges': data['total_charges'],
        'Total Refunds': data['total_refunds'],
        'Total Extra Data Charges': data['total_extra_data_charges'],
        'Total Long Distance Charges': data['total_long_distance_charges'],
        'Satisfaction Score': data['satisfaction_score'],
        'Offer_No Offer': 1 if data['offer'] == 'No Offer' else 0,
        'Offer_Offer A': 1 if data['offer'] == 'Offer A' else 0,
        'Offer_Offer B': 1 if data['offer'] == 'Offer B' else 0,
        'Offer_Offer C': 1 if data['offer'] == 'Offer C' else 0,
        'Offer_Offer D': 1 if data['offer'] == 'Offer D' else 0,
        'Offer_Offer E': 1 if data['offer'] == 'Offer E' else 0,
        'Internet Type_Cable': 1 if data['internet_type'] == 'Cable' else 0,
        'Internet Type_DSL': 1 if data['internet_type'] == 'DSL' else 0,
        'Internet Type_Fiber Optic': 1 if data['internet_type'] == 'Fiber Optic' else 0,
        'Internet Type_No Internet': 1 if data['internet_type'] == 'No Internet' else 0,
        'Payment Method_Bank Withdrawal': 1 if data['payment_method'] == 'Bank Withdrawal' else 0,
        'Payment Method_Credit Card': 1 if data['payment_method'] == 'Credit Card' else 0,
        'Payment Method_Mailed Check': 1 if data['payment_method'] == 'Mailed Check' else 0,
    }

    input_df = pd.DataFrame([input_data])[feature_cols]
    input_df[scale_cols] = scaler.transform(input_df[scale_cols])

    prediction = int(model.predict(input_df)[0])
    probability = float(model.predict_proba(input_df)[0][1])
    risk_level = 'High' if probability >= 0.7 else \
                 'Medium' if probability >= 0.4 else 'Low'

    shap_vals = explainer.shap_values(input_df)
    shap_dict = dict(zip(feature_cols, shap_vals[0].tolist()))

    top_factors = sorted(
        [{'factor': k,
          'shap_value': round(v, 4),
          'direction': 'Increases Risk' if v > 0 else 'Decreases Risk',
          'impact': 'High' if abs(v) >= 1.0 else
                    'Medium' if abs(v) >= 0.3 else 'Low'}
         for k, v in shap_dict.items()],
        key=lambda x: abs(x['shap_value']),
        reverse=True
    )[:5]

    return prediction, probability, risk_level, shap_dict, top_factors

# Get campaign IDs
cur.execute("SELECT id FROM campaigns WHERE survey_token = 'q1-2026'")
q1_2026_id = cur.fetchone()[0]

cur.execute("SELECT id FROM campaigns WHERE survey_token = 'q3-2025'")
q3_2025_id = cur.fetchone()[0]

cur.execute("SELECT id FROM campaigns WHERE survey_token = 'q1-2025'")
q1_2025_id = cur.fetchone()[0]

print(f"\nCampaign IDs: Q1 2025={q1_2025_id}, Q3 2025={q3_2025_id}, Q1 2026={q1_2026_id}")

# Medium risk customers to add
medium_customers = [
    {'name': 'Oliver Bennett', 'email': 'oliver.bennett@email.com'},
    {'name': 'Sophie Turner', 'email': 'sophie.turner@email.com'},
    {'name': 'Liam Harrison', 'email': 'liam.harrison@email.com'},
    {'name': 'Emma Collins', 'email': 'emma.collins@email.com'},
    {'name': 'Noah Mitchell', 'email': 'noah.mitchell@email.com'},
    {'name': 'Ava Peterson', 'email': 'ava.peterson@email.com'},
    {'name': 'William Cooper', 'email': 'william.cooper@email.com'},
    {'name': 'Isabella Reed', 'email': 'isabella.reed@email.com'},
    {'name': 'James Morgan', 'email': 'james.morgan@email.com'},
    {'name': 'Mia Bailey', 'email': 'mia.bailey@email.com'},
    {'name': 'Benjamin Hughes', 'email': 'benjamin.hughes@email.com'},
    {'name': 'Charlotte Rivera', 'email': 'charlotte.rivera@email.com'},
    {'name': 'Lucas Foster', 'email': 'lucas.foster@email.com'},
    {'name': 'Amelia Price', 'email': 'amelia.price@email.com'},
    {'name': 'Mason Bell', 'email': 'mason.bell@email.com'},
    {'name': 'Harper Diaz', 'email': 'harper.diaz@email.com'},
    {'name': 'Ethan Sanders', 'email': 'ethan.sanders@email.com'},
    {'name': 'Evelyn Wood', 'email': 'evelyn.wood@email.com'},
    {'name': 'Alexander Barnes', 'email': 'alexander.barnes@email.com'},
    {'name': 'Abigail Ross', 'email': 'abigail.ross@email.com'},
]

# Distribute across campaigns
# 7 in Q1 2025, 7 in Q3 2025, 6 in Q1 2026
campaign_assignments = (
    [(q1_2025_id, '2025-01-15', '2025-02-28')] * 7 +
    [(q3_2025_id, '2025-07-10', '2025-08-31')] * 7 +
    [(q1_2026_id, '2026-01-20', '2026-02-28')] * 6
)

recommendation = 'Monitor closely. Consider reaching out within the week with a personalised offer or service upgrade.'

added = 0
skipped = 0

print("\nAdding medium risk customers...")
print("-" * 60)

for i, customer in enumerate(medium_customers):
    campaign_id, date_start, date_end = campaign_assignments[i]

    for attempt in range(10):
        data = generate_medium_risk_profile()
        prediction, probability, risk_level, shap_dict, top_factors = \
            run_prediction(data, data['age'])

        if risk_level == 'Medium':
            submitted_at = random_date(date_start, date_end)

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
                    campaign_id, submitted_at
                ) VALUES (
                    %s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,
                    %s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s
                ) RETURNING id
            ''', (
                customer['name'], customer['email'],
                data['gender'], data['age'],
                data['senior_citizen'], data['married'],
                data['dependents'], data['number_of_dependents'],
                data['referred_a_friend'], data['number_of_referrals'],
                data['tenure_in_months'], data['offer'],
                data['phone_service'],
                data['avg_monthly_long_distance_charges'],
                data['multiple_lines'], data['internet_service'],
                data['internet_type'], data['avg_monthly_gb_download'],
                data['online_security'], data['online_backup'],
                data['device_protection_plan'],
                data['premium_tech_support'],
                data['streaming_tv'], data['streaming_movies'],
                data['streaming_music'], data['unlimited_data'],
                data['contract'], data['paperless_billing'],
                data['payment_method'], data['monthly_charge'],
                data['total_charges'], data['total_refunds'],
                data['total_extra_data_charges'],
                data['total_long_distance_charges'],
                data['satisfaction_score'],
                campaign_id, submitted_at
            ))
            customer_id = cur.fetchone()[0]

            cur.execute('''
                INSERT INTO predictions (
                    customer_id, prediction, probability, risk_level,
                    recommendation, shap_values, top_factors
                ) VALUES (%s,%s,%s,%s,%s,%s,%s)
            ''', (
                customer_id,
                prediction,
                round(probability * 100, 2),
                risk_level,
                recommendation,
                json.dumps(shap_dict),
                json.dumps(top_factors)
            ))

            print(f"  Added: {customer['name']} | {risk_level} | "
                  f"{round(probability*100,2)}% | Campaign {campaign_id}")
            added += 1
            break
    else:
        print(f"  Skipped: {customer['name']} - could not reach Medium Risk")
        skipped += 1

conn.commit()

# Final summary
print("\n" + "="*50)
print("SUMMARY")
print("="*50)
print(f"Successfully added: {added}")
print(f"Skipped: {skipped}")
print()
cur.execute('SELECT COUNT(*) FROM customers')
print(f"Total customers now: {cur.fetchone()[0]}")
cur.execute("SELECT COUNT(*) FROM predictions WHERE risk_level='High'")
print(f"High Risk: {cur.fetchone()[0]}")
cur.execute("SELECT COUNT(*) FROM predictions WHERE risk_level='Medium'")
print(f"Medium Risk: {cur.fetchone()[0]}")
cur.execute("SELECT COUNT(*) FROM predictions WHERE risk_level='Low'")
print(f"Low Risk: {cur.fetchone()[0]}")

cur.close()
conn.close()
print("\nDone!")