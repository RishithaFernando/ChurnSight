import psycopg2
import random
import uuid
from datetime import datetime, timedelta

# Database connection
conn = psycopg2.connect(
    host='localhost',
    port=5432,
    database='churnsight',
    user='postgres',
    password='rishitha'
)
cur = conn.cursor()

print("Connected to database...")

# ─── Create 3 Campaigns ───────────────────────────────────
campaigns = [
    {
        'name': 'Q1 2025 Customer Survey',
        'description': 'First quarterly survey to assess customer satisfaction and churn risk.',
        'token': 'q1-2025',
        'created_at': '2025-01-15',
        'is_active': False
    },
    {
        'name': 'Q3 2025 Customer Survey',
        'description': 'Mid-year survey following retention initiatives launched in Q2.',
        'token': 'q3-2025',
        'created_at': '2025-07-10',
        'is_active': False
    },
    {
        'name': 'Q1 2026 Customer Survey',
        'description': 'Latest survey to measure the impact of our improved service packages.',
        'token': 'q1-2026',
        'created_at': '2026-01-20',
        'is_active': True
    }
]

campaign_ids = []
for c in campaigns:
    cur.execute('''
        INSERT INTO campaigns (name, description, survey_token, created_at, is_active)
        VALUES (%s, %s, %s, %s, %s)
        ON CONFLICT (survey_token) DO NOTHING
        RETURNING id
    ''', (c['name'], c['description'], c['token'], c['created_at'], c['is_active']))
    result = cur.fetchone()
    if result:
        campaign_ids.append(result[0])
        print(f"Created campaign: {c['name']} (id: {result[0]})")
    else:
        cur.execute('SELECT id FROM campaigns WHERE survey_token = %s', (c['token'],))
        existing_id = cur.fetchone()[0]
        campaign_ids.append(existing_id)
        print(f"Campaign already exists: {c['name']} (id: {existing_id})")

conn.commit()
print(f"\nCampaign IDs: {campaign_ids}")

# ─── Customer Profiles ────────────────────────────────────
# 30 returning customers who appear in all 3 campaigns
# 20 unique customers per campaign

returning_customers = [
    {'name': 'James Wilson', 'email': 'james.wilson@email.com'},
    {'name': 'Sarah Johnson', 'email': 'sarah.johnson@email.com'},
    {'name': 'Michael Brown', 'email': 'michael.brown@email.com'},
    {'name': 'Emily Davis', 'email': 'emily.davis@email.com'},
    {'name': 'Robert Martinez', 'email': 'robert.martinez@email.com'},
    {'name': 'Jessica Taylor', 'email': 'jessica.taylor@email.com'},
    {'name': 'David Anderson', 'email': 'david.anderson@email.com'},
    {'name': 'Ashley Thomas', 'email': 'ashley.thomas@email.com'},
    {'name': 'Christopher Jackson', 'email': 'chris.jackson@email.com'},
    {'name': 'Amanda White', 'email': 'amanda.white@email.com'},
    {'name': 'Matthew Harris', 'email': 'matthew.harris@email.com'},
    {'name': 'Stephanie Martin', 'email': 'stephanie.martin@email.com'},
    {'name': 'Daniel Thompson', 'email': 'daniel.thompson@email.com'},
    {'name': 'Melissa Garcia', 'email': 'melissa.garcia@email.com'},
    {'name': 'Ryan Martinez', 'email': 'ryan.martinez@email.com'},
    {'name': 'Nicole Robinson', 'email': 'nicole.robinson@email.com'},
    {'name': 'Kevin Clark', 'email': 'kevin.clark@email.com'},
    {'name': 'Lauren Rodriguez', 'email': 'lauren.rodriguez@email.com'},
    {'name': 'Brian Lewis', 'email': 'brian.lewis@email.com'},
    {'name': 'Samantha Lee', 'email': 'samantha.lee@email.com'},
    {'name': 'Justin Walker', 'email': 'justin.walker@email.com'},
    {'name': 'Rachel Hall', 'email': 'rachel.hall@email.com'},
    {'name': 'Brandon Allen', 'email': 'brandon.allen@email.com'},
    {'name': 'Megan Young', 'email': 'megan.young@email.com'},
    {'name': 'Tyler Hernandez', 'email': 'tyler.hernandez@email.com'},
    {'name': 'Brittany King', 'email': 'brittany.king@email.com'},
    {'name': 'Nathan Wright', 'email': 'nathan.wright@email.com'},
    {'name': 'Heather Lopez', 'email': 'heather.lopez@email.com'},
    {'name': 'Aaron Scott', 'email': 'aaron.scott@email.com'},
    {'name': 'Amber Green', 'email': 'amber.green@email.com'},
]

unique_customers_q1_2025 = [
    {'name': 'George Adams', 'email': 'george.adams@email.com'},
    {'name': 'Patricia Baker', 'email': 'patricia.baker@email.com'},
    {'name': 'Charles Carter', 'email': 'charles.carter@email.com'},
    {'name': 'Linda Mitchell', 'email': 'linda.mitchell@email.com'},
    {'name': 'Mark Perez', 'email': 'mark.perez@email.com'},
    {'name': 'Barbara Roberts', 'email': 'barbara.roberts@email.com'},
    {'name': 'Steven Turner', 'email': 'steven.turner@email.com'},
    {'name': 'Betty Phillips', 'email': 'betty.phillips@email.com'},
    {'name': 'Edward Campbell', 'email': 'edward.campbell@email.com'},
    {'name': 'Dorothy Parker', 'email': 'dorothy.parker@email.com'},
    {'name': 'Ronald Evans', 'email': 'ronald.evans@email.com'},
    {'name': 'Sandra Edwards', 'email': 'sandra.edwards@email.com'},
    {'name': 'Kenneth Collins', 'email': 'kenneth.collins@email.com'},
    {'name': 'Carol Stewart', 'email': 'carol.stewart@email.com'},
    {'name': 'Anthony Sanchez', 'email': 'anthony.sanchez@email.com'},
    {'name': 'Ruth Morris', 'email': 'ruth.morris@email.com'},
    {'name': 'Donald Rogers', 'email': 'donald.rogers@email.com'},
    {'name': 'Sharon Reed', 'email': 'sharon.reed@email.com'},
    {'name': 'Paul Cook', 'email': 'paul.cook@email.com'},
    {'name': 'Helen Morgan', 'email': 'helen.morgan@email.com'},
]

unique_customers_q3_2025 = [
    {'name': 'Frank Bell', 'email': 'frank.bell@email.com'},
    {'name': 'Donna Murphy', 'email': 'donna.murphy@email.com'},
    {'name': 'Raymond Bailey', 'email': 'raymond.bailey@email.com'},
    {'name': 'Carolyn Rivera', 'email': 'carolyn.rivera@email.com'},
    {'name': 'Jack Cooper', 'email': 'jack.cooper@email.com'},
    {'name': 'Maria Richardson', 'email': 'maria.richardson@email.com'},
    {'name': 'Dennis Cox', 'email': 'dennis.cox@email.com'},
    {'name': 'Janet Howard', 'email': 'janet.howard@email.com'},
    {'name': 'Jerry Ward', 'email': 'jerry.ward@email.com'},
    {'name': 'Catherine Torres', 'email': 'catherine.torres@email.com'},
    {'name': 'Walter Peterson', 'email': 'walter.peterson@email.com'},
    {'name': 'Frances Gray', 'email': 'frances.gray@email.com'},
    {'name': 'Patrick Ramirez', 'email': 'patrick.ramirez@email.com'},
    {'name': 'Joyce James', 'email': 'joyce.james@email.com'},
    {'name': 'Harold Watson', 'email': 'harold.watson@email.com'},
    {'name': 'Evelyn Brooks', 'email': 'evelyn.brooks@email.com'},
    {'name': 'Carl Kelly', 'email': 'carl.kelly@email.com'},
    {'name': 'Judy Sanders', 'email': 'judy.sanders@email.com'},
    {'name': 'Arthur Price', 'email': 'arthur.price@email.com'},
    {'name': 'Christina Bennett', 'email': 'christina.bennett@email.com'},
]

unique_customers_q1_2026 = [
    {'name': 'Phillip Wood', 'email': 'phillip.wood@email.com'},
    {'name': 'Diane Barnes', 'email': 'diane.barnes@email.com'},
    {'name': 'Wayne Ross', 'email': 'wayne.ross@email.com'},
    {'name': 'Julie Henderson', 'email': 'julie.henderson@email.com'},
    {'name': 'Ralph Coleman', 'email': 'ralph.coleman@email.com'},
    {'name': 'Theresa Jenkins', 'email': 'theresa.jenkins@email.com'},
    {'name': 'Roy Perry', 'email': 'roy.perry@email.com'},
    {'name': 'Virginia Powell', 'email': 'virginia.powell@email.com'},
    {'name': 'Eugene Long', 'email': 'eugene.long@email.com'},
    {'name': 'Kathryn Patterson', 'email': 'kathryn.patterson@email.com'},
    {'name': 'Billy Hughes', 'email': 'billy.hughes@email.com'},
    {'name': 'Martha Flores', 'email': 'martha.flores@email.com'},
    {'name': 'Bobby Washington', 'email': 'bobby.washington@email.com'},
    {'name': 'Debra Butler', 'email': 'debra.butler@email.com'},
    {'name': 'Johnny Simmons', 'email': 'johnny.simmons@email.com'},
    {'name': 'Gloria Foster', 'email': 'gloria.foster@email.com'},
    {'name': 'Terry Gonzalez', 'email': 'terry.gonzalez@email.com'},
    {'name': 'Wanda Bryant', 'email': 'wanda.bryant@email.com'},
    {'name': 'Lawrence Alexander', 'email': 'lawrence.alexander@email.com'},
    {'name': 'Cheryl Russell', 'email': 'cheryl.russell@email.com'},
]

# ─── Data Generation Functions ────────────────────────────

def random_date(start_str, end_str):
    start = datetime.strptime(start_str, '%Y-%m-%d')
    end = datetime.strptime(end_str, '%Y-%m-%d')
    delta = end - start
    return start + timedelta(days=random.randint(0, delta.days))

def generate_customer_data(campaign_index, profile='random'):
    """
    campaign_index: 0=Q1 2025, 1=Q3 2025, 2=Q1 2026
    profile: 'high_risk', 'low_risk', 'random'
    """

    # Satisfaction score distribution per campaign
    # Q1 2025: mostly low (1-2), Q3 2025: mixed (2-3), Q1 2026: mostly high (3-5)
    if campaign_index == 0:
        if profile == 'high_risk':
            satisfaction = random.choice([1, 1, 2, 2])
            contract = random.choice([0, 0, 0, 1])
            tenure = random.randint(1, 12)
            monthly_charge = random.uniform(75, 110)
        elif profile == 'low_risk':
            satisfaction = random.choice([3, 4, 4, 5])
            contract = random.choice([1, 2, 2])
            tenure = random.randint(24, 60)
            monthly_charge = random.uniform(30, 70)
        else:
            satisfaction = random.choice([1, 1, 2, 2, 3, 4])
            contract = random.choice([0, 0, 0, 1, 2])
            tenure = random.randint(1, 36)
            monthly_charge = random.uniform(40, 110)

    elif campaign_index == 1:
        if profile == 'high_risk':
            satisfaction = random.choice([1, 2, 2, 3])
            contract = random.choice([0, 0, 1])
            tenure = random.randint(3, 18)
            monthly_charge = random.uniform(70, 105)
        elif profile == 'low_risk':
            satisfaction = random.choice([3, 4, 4, 5])
            contract = random.choice([1, 1, 2])
            tenure = random.randint(18, 60)
            monthly_charge = random.uniform(30, 75)
        else:
            satisfaction = random.choice([1, 2, 3, 3, 4, 5])
            contract = random.choice([0, 0, 1, 1, 2])
            tenure = random.randint(3, 48)
            monthly_charge = random.uniform(35, 105)

    else:
        if profile == 'high_risk':
            satisfaction = random.choice([1, 2, 2])
            contract = random.choice([0, 0, 1])
            tenure = random.randint(1, 12)
            monthly_charge = random.uniform(70, 110)
        elif profile == 'low_risk':
            satisfaction = random.choice([4, 4, 5, 5])
            contract = random.choice([1, 2, 2, 2])
            tenure = random.randint(24, 72)
            monthly_charge = random.uniform(25, 65)
        else:
            satisfaction = random.choice([2, 3, 4, 4, 5])
            contract = random.choice([0, 1, 1, 2, 2])
            tenure = random.randint(6, 60)
            monthly_charge = random.uniform(30, 100)

    internet_service = random.choice([1, 1, 1, 0])
    internet_type_options = ['Fiber Optic', 'DSL', 'Cable', 'No Internet']
    internet_type = random.choice(internet_type_options) if internet_service else 'No Internet'

    total_charges = round(monthly_charge * tenure, 2)

    return {
        'gender': random.choice([0, 1]),
        'age': random.randint(22, 78),
        'senior_citizen': random.choice([0, 0, 0, 1]),
        'married': random.choice([0, 1]),
        'dependents': random.choice([0, 0, 1]),
        'number_of_dependents': random.choice([0, 0, 1, 2]),
        'referred_a_friend': random.choice([0, 0, 1]),
        'number_of_referrals': random.choice([0, 0, 0, 1, 2]),
        'tenure_in_months': tenure,
        'offer': random.choice(['No Offer', 'Offer A', 'Offer B', 'Offer C', 'Offer D', 'Offer E']),
        'phone_service': random.choice([0, 1, 1, 1]),
        'avg_monthly_long_distance_charges': round(random.uniform(0, 50), 2),
        'multiple_lines': random.choice([0, 1]),
        'internet_service': internet_service,
        'internet_type': internet_type,
        'avg_monthly_gb_download': random.randint(0, 80),
        'online_security': random.choice([0, 0, 1]),
        'online_backup': random.choice([0, 1]),
        'device_protection_plan': random.choice([0, 1]),
        'premium_tech_support': random.choice([0, 0, 1]),
        'streaming_tv': random.choice([0, 1]),
        'streaming_movies': random.choice([0, 1]),
        'streaming_music': random.choice([0, 1]),
        'unlimited_data': random.choice([0, 1]),
        'contract': contract,
        'paperless_billing': random.choice([0, 1]),
        'payment_method': random.choice(['Bank Withdrawal', 'Credit Card', 'Mailed Check']),
        'monthly_charge': round(monthly_charge, 2),
        'total_charges': total_charges,
        'total_refunds': round(random.uniform(0, 20), 2),
        'total_extra_data_charges': random.choice([0, 0, 10, 20]),
        'total_long_distance_charges': round(random.uniform(0, 200), 2),
        'satisfaction_score': satisfaction,
    }

def insert_customer(name, email, campaign_id, campaign_index,
                    submitted_at, profile='random'):
    data = generate_customer_data(campaign_index, profile)

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
        name, email, data['gender'], data['age'],
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
        data['satisfaction_score'],
        campaign_id, submitted_at
    ))

    customer_id = cur.fetchone()[0]
    return customer_id, data

# ─── Run Prediction and Insert ────────────────────────────
import joblib
import shap
import pandas as pd
import numpy as np
import json
import warnings
warnings.filterwarnings('ignore')

model = joblib.load('churnsight_artifacts/xgb_model.pkl')
scaler = joblib.load('churnsight_artifacts/scaler.pkl')
feature_cols = joblib.load('churnsight_artifacts/feature_cols.pkl')
explainer = shap.TreeExplainer(model)

scale_cols = [
    'Age', 'Number of Dependents', 'Number of Referrals',
    'Tenure in Months', 'Avg Monthly Long Distance Charges',
    'Avg Monthly GB Download', 'Monthly Charge', 'Total Charges',
    'Total Refunds', 'Total Extra Data Charges',
    'Total Long Distance Charges', 'Satisfaction Score'
]

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
    risk_level = 'High' if probability >= 0.7 else 'Medium' if probability >= 0.4 else 'Low'

    shap_vals = explainer.shap_values(input_df)
    shap_dict = dict(zip(feature_cols, shap_vals[0].tolist()))

    top_factors = sorted(
        [{'factor': k,
          'shap_value': round(v, 4),
          'direction': 'Increases Risk' if v > 0 else 'Decreases Risk',
          'impact': 'High' if abs(v) >= 1.0 else 'Medium' if abs(v) >= 0.3 else 'Low'}
         for k, v in shap_dict.items()],
        key=lambda x: abs(x['shap_value']),
        reverse=True
    )[:5]

    return prediction, probability, risk_level, shap_dict, top_factors

def insert_prediction(customer_id, data, age):
    prediction, probability, risk_level, shap_dict, top_factors = run_prediction(data, age)

    risk_map = {
        'High': 'Immediate retention action required. Contact this customer within 24 hours.',
        'Medium': 'Monitor closely. Consider reaching out within the week.',
        'Low': 'No immediate action needed. Continue standard engagement.'
    }

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
        risk_map[risk_level],
        json.dumps(shap_dict),
        json.dumps(top_factors)
    ))
    return risk_level

# ─── Campaign Date Ranges ─────────────────────────────────
date_ranges = [
    ('2025-01-15', '2025-02-28'),
    ('2025-07-10', '2025-08-31'),
    ('2026-01-20', '2026-02-28'),
]

# Profile distributions per campaign
# Q1 2025: 40% high risk, 35% random, 25% low risk
# Q3 2025: 28% high risk, 40% random, 32% low risk
# Q1 2026: 20% high risk, 35% random, 45% low risk
profile_distributions = [
    ['high_risk'] * 20 + ['random'] * 17 + ['low_risk'] * 13,
    ['high_risk'] * 14 + ['random'] * 20 + ['low_risk'] * 16,
    ['high_risk'] * 10 + ['random'] * 17 + ['low_risk'] * 23,
]

# ─── Insert Returning Customers (appear in all 3 campaigns)
print("\nInserting returning customers...")
for ci, (campaign_id, date_range, profiles) in enumerate(
        zip(campaign_ids, date_ranges, profile_distributions)):

    random.shuffle(profiles)

    for i, customer in enumerate(returning_customers):
        submitted_at = random_date(date_range[0], date_range[1])
        profile = profiles[i]
        customer_id, data = insert_customer(
            customer['name'], customer['email'],
            campaign_id, ci, submitted_at, profile
        )
        risk = insert_prediction(customer_id, data, data['age'])
        print(f"  Campaign {ci+1} | {customer['name']} | {risk}")

# ─── Insert Unique Customers Per Campaign ─────────────────
print("\nInserting unique customers...")

unique_lists = [
    unique_customers_q1_2025,
    unique_customers_q3_2025,
    unique_customers_q1_2026
]

for ci, (campaign_id, date_range, profiles, unique_list) in enumerate(
        zip(campaign_ids, date_ranges, profile_distributions, unique_lists)):

    random.shuffle(profiles)

    for i, customer in enumerate(unique_list):
        submitted_at = random_date(date_range[0], date_range[1])
        profile = profiles[i % len(profiles)]
        customer_id, data = insert_customer(
            customer['name'], customer['email'],
            campaign_id, ci, submitted_at, profile
        )
        risk = insert_prediction(customer_id, data, data['age'])
        print(f"  Campaign {ci+1} | {customer['name']} | {risk}")

conn.commit()

# ─── Summary ──────────────────────────────────────────────
print("\n" + "="*50)
print("DATA GENERATION COMPLETE")
print("="*50)

cur.execute('SELECT COUNT(*) FROM campaigns')
print(f"Total campaigns: {cur.fetchone()[0]}")

cur.execute('SELECT COUNT(*) FROM customers')
print(f"Total customers: {cur.fetchone()[0]}")

cur.execute('SELECT COUNT(*) FROM predictions')
print(f"Total predictions: {cur.fetchone()[0]}")

cur.execute("""
    SELECT camp.name,
           COUNT(c.id) as responses,
           SUM(CASE WHEN p.risk_level='High' THEN 1 ELSE 0 END) as high,
           SUM(CASE WHEN p.risk_level='Medium' THEN 1 ELSE 0 END) as medium,
           SUM(CASE WHEN p.risk_level='Low' THEN 1 ELSE 0 END) as low
    FROM campaigns camp
    LEFT JOIN customers c ON camp.id = c.campaign_id
    LEFT JOIN predictions p ON c.id = p.customer_id
    GROUP BY camp.name
    ORDER BY camp.created_at
""")
rows = cur.fetchall()
print("\nCampaign Summary:")
for row in rows:
    print(f"  {row[0]}: {row[1]} responses | High:{row[2]} Medium:{row[3]} Low:{row[4]}")

cur.close()
conn.close()
print("\nDone!")