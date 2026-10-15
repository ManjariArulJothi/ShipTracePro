-- Seed Comprehensive Test Data for All 5 Dashboards (Admin + 4 Dashboards)
-- ShiptrackPro Database

BEGIN;

-- 1. Ensure Company exists and link to Business Client (tharun@gmail.com, id 2)
INSERT INTO companies (id, company_name, contact_person, email, phone, gst_number, tax_id, website, address, city, state, postal_code, country, is_active, created_at, updated_at)
VALUES (1, 'Apex Logistics & Retail Ltd', 'Tharun Kruthik', 'tharun@gmail.com', '+91 98765 43210', '33AAACA1234A1Z5', 'PAN-APX99281', 'https://apexlogistics.in', '100 Expressway Avenue, Tech Park', 'Coimbatore', 'Tamil Nadu', '641014', 'India', true, NOW() - INTERVAL '30 days', NOW())
ON CONFLICT (id) DO UPDATE SET company_name = EXCLUDED.company_name;

UPDATE users SET company_id = 1, company_name = 'Apex Logistics & Retail Ltd' WHERE id = 2;

-- 2. Insert Fleet Vehicles
INSERT INTO vehicles (id, vehicle_number, vehicle_type, manufacturer, model, registration_number, capacity_kg, current_driver_id, fuel_percentage, average_speed, status, last_service_date, next_service_date, created_at, updated_at)
VALUES 
(1, 'VEH-001', 'VAN', 'Tata Motors', 'Tata Ace Gold', 'TN-09-AB-1234', 1000.00, 6, 85.00, 42.50, 'ON_DELIVERY', CURRENT_DATE - 15, CURRENT_DATE + 45, NOW() - INTERVAL '60 days', NOW()),
(2, 'VEH-002', 'TRUCK', 'Ashok Leyland', 'Ecomet 1215', 'TN-01-CD-5678', 5000.00, NULL, 92.00, 58.00, 'AVAILABLE', CURRENT_DATE - 5, CURRENT_DATE + 55, NOW() - INTERVAL '60 days', NOW()),
(3, 'VEH-003', 'BIKE', 'TVS', 'TVS King Cargo', 'TN-22-EF-9012', 250.00, 6, 72.00, 34.00, 'ON_DELIVERY', CURRENT_DATE - 20, CURRENT_DATE + 40, NOW() - INTERVAL '60 days', NOW()),
(4, 'VEH-004', 'ELECTRIC_VAN', 'Mahindra', 'Treo Zor EV', 'TN-07-GH-3456', 800.00, NULL, 96.00, 38.00, 'AVAILABLE', CURRENT_DATE - 10, CURRENT_DATE + 50, NOW() - INTERVAL '60 days', NOW())
ON CONFLICT (id) DO UPDATE SET 
  vehicle_number = EXCLUDED.vehicle_number,
  status = EXCLUDED.status,
  fuel_percentage = EXCLUDED.fuel_percentage,
  current_driver_id = EXCLUDED.current_driver_id;

SELECT setval('vehicles_id_seq', (SELECT COALESCE(MAX(id), 1) FROM vehicles));

-- 3. Insert Shipments Covering ALL 9 Statuses (including FAILED_DELIVERY, OUT_FOR_DELIVERY, IN_TRANSIT, CANCELLED, DELIVERED, RETURNED, etc.)
INSERT INTO shipments (
  id, tracking_number, customer_id, business_client_id, driver_id,
  sender_name, sender_phone, sender_email, sender_address, sender_city, sender_state, sender_postal_code, sender_country,
  receiver_name, receiver_phone, receiver_email, receiver_address, receiver_city, receiver_state, receiver_postal_code, receiver_country,
  package_type, package_description, package_weight_kg, declared_value, fragile, insured, cod_amount, shipment_type, priority,
  status, delivery_attempts, current_latitude, current_longitude,
  scheduled_pickup_at, picked_up_at, estimated_delivery_at, delivered_at, cancelled_at, cancelled_by_customer, cancellation_reason,
  created_at, updated_at
) VALUES 
-- Shipment 5: OUT_FOR_DELIVERY (Customer 3 Manju - Featured on Customer Dashboard & Driver view)
(
  5, 'TRK-88A1901B', 3, 2, 6,
  'Apex Express Hub', '+91 94431 10001', 'dispatch@apex.in', 'Warehouse Hub 4, Avinashi Rd', 'Coimbatore', 'Tamil Nadu', '641014', 'INDIA',
  'Manju Arul', '+91 98401 23456', 'manju@gmail.com', 'Flat 402, Anna Nagar West', 'Chennai', 'Tamil Nadu', '600040', 'INDIA',
  'Electronics Box', 'Apple MacBook Pro 16" & Magic Mouse', 3.50, 249999.00, true, true, 0.00, 'EXPRESS', 'URGENT',
  'OUT_FOR_DELIVERY', 0, 13.0827, 80.2707,
  NOW() - INTERVAL '1 day', NOW() - INTERVAL '18 hours', NOW() + INTERVAL '45 minutes', NULL, NULL, false, NULL,
  NOW() - INTERVAL '1 day', NOW()
),

-- Shipment 6: IN_TRANSIT (Customer 3 Manju - On Highway between Mumbai and Chennai)
(
  6, 'TRK-92C4410E', 3, 2, 6,
  'TechZone Retailers', '+91 98200 44556', 'orders@techzone.com', 'Industrial Area, Andheri East', 'Mumbai', 'Maharashtra', '400069', 'INDIA',
  'Manju Arul', '+91 98401 23456', 'manju@gmail.com', 'No. 15, Gandhi Road, Adyar', 'Chennai', 'Tamil Nadu', '600020', 'INDIA',
  'Large Fragile Box', 'Sony Bravia 65" 4K Smart OLED Television', 18.20, 145000.00, true, true, 0.00, 'STANDARD', 'HIGH',
  'IN_TRANSIT', 0, 14.4426, 79.9865,
  NOW() - INTERVAL '2 days', NOW() - INTERVAL '36 hours', NOW() + INTERVAL '14 hours', NULL, NULL, false, NULL,
  NOW() - INTERVAL '2 days', NOW()
),

-- Shipment 7: FAILED_DELIVERY (Customer 3 Manju - Critical Test Case for Failed Deliveries!)
(
  7, 'TRK-55F8102C', 3, 2, 6,
  'Apex Fashion Warehouse', '+91 98801 77665', 'warehouse@apexfashion.com', 'Electronic City Phase 1', 'Bengaluru', 'Karnataka', '560100', 'INDIA',
  'Manju Arul', '+91 98401 23456', 'manju@gmail.com', 'Apartment 3B, Lake View Residency, R.S. Puram', 'Coimbatore', 'Tamil Nadu', '641002', 'INDIA',
  'Carton Box', 'Designer Silk Sarees & Ethnic Accessories', 2.10, 18500.00, false, true, 2500.00, 'EXPRESS', 'HIGH',
  'FAILED_DELIVERY', 2, 11.0168, 76.9558,
  NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 days', NOW() - INTERVAL '4 hours', NULL, NULL, false, 'Delivery attempt failed: Customer premises locked & phone unreachable after 3 attempts',
  NOW() - INTERVAL '3 days', NOW()
),

-- Shipment 8: CANCELLED (Customer 3 Manju - Customer initiated cancellation)
(
  8, 'TRK-33D7209X', 3, 2, NULL,
  'FreshGrocers Logistics', '+91 97890 12345', 'orders@freshgrocers.in', 'Market Yard, Gandhipuram', 'Coimbatore', 'Tamil Nadu', '641012', 'INDIA',
  'Manju Arul', '+91 98401 23456', 'manju@gmail.com', 'Plot 88, Gandhipuram', 'Coimbatore', 'Tamil Nadu', '641012', 'INDIA',
  'Cooled Box', 'Organic Fruits & Imported Dairy Hamper', 6.50, 4200.00, false, false, 0.00, 'SAME_DAY', 'NORMAL',
  'CANCELLED', 0, NULL, NULL,
  NOW() - INTERVAL '2 days', NULL, NULL, NULL, NOW() - INTERVAL '1 day', true, 'Customer cancelled: Order placed with duplicate items, reordered correctly',
  NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day'
),

-- Shipment 9: OUT_FOR_DELIVERY (Customer 4 Priya Bala - Active Delivery)
(
  9, 'TRK-44B6631Z', 4, 2, 6,
  'Apex Gadgets Store', '+91 98860 33441', 'sales@apexgadgets.com', 'Brigade Road Central', 'Bengaluru', 'Karnataka', '560001', 'INDIA',
  'Priya Bala', '+91 99620 99887', 'testcustomer@test.com', 'Flat 402, Green Meadows, Velachery', 'Chennai', 'Tamil Nadu', '600042', 'INDIA',
  'Padded Parcel', 'Apple iPad Air M2 & Apple Pencil Pro', 1.25, 69900.00, true, true, 0.00, 'EXPRESS', 'URGENT',
  'OUT_FOR_DELIVERY', 0, 12.9815, 80.2180,
  NOW() - INTERVAL '1 day', NOW() - INTERVAL '16 hours', NOW() + INTERVAL '1 hour', NULL, NULL, false, NULL,
  NOW() - INTERVAL '1 day', NOW()
),

-- Shipment 10: DELIVERED (Customer 4 Priya Bala - Completed with Verified POD)
(
  10, 'TRK-22E9043M', 4, 2, 6,
  'Apex Furniture Mart', '+91 94440 22331', 'support@apexfurniture.com', 'Madhapur Hitec City', 'Hyderabad', 'Telangana', '500081', 'INDIA',
  'Priya Bala', '+91 99620 99887', 'testcustomer@test.com', 'Flat 402, Green Meadows, Velachery', 'Chennai', 'Tamil Nadu', '600042', 'INDIA',
  'Heavy Crate', 'Ergonomic Mesh High-Back Executive Chair', 15.00, 22000.00, false, true, 0.00, 'STANDARD', 'NORMAL',
  'DELIVERED', 1, 12.9815, 80.2180,
  NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 days', NOW() - INTERVAL '8 hours', NOW() - INTERVAL '6 hours', NULL, false, NULL,
  NOW() - INTERVAL '3 days', NOW() - INTERVAL '6 hours'
),

-- Shipment 11: FAILED_DELIVERY (Customer 4 Priya Bala - Critical Test Case for Failed Deliveries!)
(
  11, 'TRK-61A1187P', 4, 2, 6,
  'Apex Pharma Logistics', '+91 98210 55667', 'coldchain@apexpharma.in', 'Kurla Industrial Estate', 'Mumbai', 'Maharashtra', '400070', 'INDIA',
  'Priya Bala', '+91 99620 99887', 'testcustomer@test.com', 'Flat 402, Green Meadows, Velachery', 'Chennai', 'Tamil Nadu', '600042', 'INDIA',
  'Insulated Container', 'Temperature-Sensitive Medical Diagnostic Kit', 3.20, 35000.00, true, true, 0.00, 'EXPRESS', 'URGENT',
  'FAILED_DELIVERY', 3, 12.9815, 80.2180,
  NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day', NOW() - INTERVAL '2 hours', NULL, NULL, false, 'Delivery attempt failed: Gated community access denied without resident clearance code & customer phone busy',
  NOW() - INTERVAL '2 days', NOW()
),

-- Shipment 12: ARRIVED_AT_HUB (Customer 3 Manju - Sorting facility scan)
(
  12, 'TRK-77H4392K', 3, 2, NULL,
  'Apex Industrial Components', '+91 98111 88990', 'dispatch@apexindustrial.in', 'Okhla Industrial Area Phase 3', 'Delhi', 'Delhi', '110020', 'INDIA',
  'Manju Arul', '+91 98401 23456', 'manju@gmail.com', 'No. 10, Cross Cut Road, Gandhipuram', 'Coimbatore', 'Tamil Nadu', '641012', 'INDIA',
  'Reinforced Wooden Box', 'High-Precision Optical Sensors & Calibrators', 5.40, 112000.00, true, true, 0.00, 'OVERNIGHT', 'URGENT',
  'ARRIVED_AT_HUB', 0, 12.9716, 77.5946,
  NOW() - INTERVAL '1 day', NOW() - INTERVAL '18 hours', NOW() + INTERVAL '16 hours', NULL, NULL, false, NULL,
  NOW() - INTERVAL '1 day', NOW()
),

-- Shipment 13: PICKED_UP (Customer 4 Priya Bala - Awaiting Hub Sorting)
(
  13, 'TRK-83K5521R', 4, 2, 6,
  'Zenith Sports Equipment', '+91 98410 77889', 'dispatch@zenithsports.in', 'Mount Road Commercial complex', 'Chennai', 'Tamil Nadu', '600002', 'INDIA',
  'Priya Bala', '+91 99620 99887', 'testcustomer@test.com', '12, KK Nagar West', 'Madurai', 'Tamil Nadu', '625020', 'INDIA',
  'Sports Duffle Bag', 'Yonex Professional Badminton Racquet & Shuttle Set', 4.10, 16800.00, false, false, 1200.00, 'STANDARD', 'NORMAL',
  'PICKED_UP', 0, 13.0827, 80.2707,
  NOW() - INTERVAL '6 hours', NOW() - INTERVAL '3 hours', NOW() + INTERVAL '24 hours', NULL, NULL, false, NULL,
  NOW() - INTERVAL '6 hours', NOW()
),

-- Shipment 14: RETURNED (Customer 3 Manju - Returned to Origin)
(
  14, 'TRK-99N7812L', 3, 2, 6,
  'Apex Fashion Warehouse', '+91 98801 77665', 'returns@apexfashion.com', 'Electronic City Phase 1', 'Bengaluru', 'Karnataka', '560100', 'INDIA',
  'Manju Arul', '+91 98401 23456', 'manju@gmail.com', 'No. 55, Avinashi Road, Peelamedu', 'Coimbatore', 'Tamil Nadu', '641004', 'INDIA',
  'Carton Box', 'Returned Goods - 3 attempts exhausted', 3.00, 12000.00, false, false, 0.00, 'STANDARD', 'LOW',
  'RETURNED', 3, 12.9716, 77.5946,
  NOW() - INTERVAL '6 days', NOW() - INTERVAL '5 days', NOW() - INTERVAL '3 days', NULL, NULL, false, 'Returned to sender warehouse: Delivery address untraceable after 3 attempts',
  NOW() - INTERVAL '6 days', NOW() - INTERVAL '1 day'
),

-- Shipment 15: DELIVERED with PENDING POD (Admin & Operator can verify POD!)
(
  15, 'TRK-10P3948V', 3, 2, 6,
  'Apex Home Appliances', '+91 94431 10001', 'sales@apexhome.in', 'Avinashi Road', 'Coimbatore', 'Tamil Nadu', '641014', 'INDIA',
  'Kavitha Arul', '+91 98401 23456', 'manju@gmail.com', 'Flat 2A, Rainbow Enclave, OMR', 'Chennai', 'Tamil Nadu', '600096', 'INDIA',
  'Sturdy Box', 'Smart Air Fryer & Microwave Cooker Combo', 8.20, 14999.00, false, true, 0.00, 'EXPRESS', 'NORMAL',
  'DELIVERED', 1, 12.9165, 80.2285,
  NOW() - INTERVAL '1 day', NOW() - INTERVAL '20 hours', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '1 hour', NULL, false, NULL,
  NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 hour'
)
ON CONFLICT (id) DO UPDATE SET
  tracking_number = EXCLUDED.tracking_number,
  status = EXCLUDED.status,
  delivery_attempts = EXCLUDED.delivery_attempts,
  current_latitude = EXCLUDED.current_latitude,
  current_longitude = EXCLUDED.current_longitude,
  cancellation_reason = EXCLUDED.cancellation_reason,
  delivered_at = EXCLUDED.delivered_at;

SELECT setval('shipments_id_seq', (SELECT COALESCE(MAX(id), 1) FROM shipments));

-- 4. Proofs of Delivery (PODs)
-- Shipment 10: Verified POD
INSERT INTO proofs_of_delivery (id, shipment_id, signature_data, recipient_name, recipient_phone, photo_url, delivery_notes, verified_by, verification_status, verified_at, captured_at)
VALUES 
(3, 10, 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="80"><path d="M10 50 Q 50 10, 100 50 T 190 40" stroke="navy" fill="none" stroke-width="3"/></svg>', 'Priya Bala', '+91 99620 99887', 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=400', 'Handed over directly to customer at Flat 402 with OTP verification', 1, 'VERIFIED', NOW() - INTERVAL '5 hours', NOW() - INTERVAL '6 hours'),
-- Shipment 15: PENDING POD (Ready for Admin/Operator to verify in POD page!)
(4, 15, 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="80"><path d="M20 60 Q 60 20, 110 55 T 180 30" stroke="darkgreen" fill="none" stroke-width="3"/></svg>', 'Kavitha Arul', '+91 98401 23456', 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400', 'Package handed over to family member at door with digital signature', NULL, 'PENDING', NULL, NOW() - INTERVAL '1 hour')
ON CONFLICT (id) DO UPDATE SET 
  verification_status = EXCLUDED.verification_status,
  delivery_notes = EXCLUDED.delivery_notes;

SELECT setval('proofs_of_delivery_id_seq', (SELECT COALESCE(MAX(id), 1) FROM proofs_of_delivery));

-- 5. Tracking Events Checkpoints
DELETE FROM tracking_events WHERE shipment_id IN (5, 6, 7, 9, 10, 11, 15);

INSERT INTO tracking_events (shipment_id, recorded_by, event_type, shipment_status, latitude, longitude, address, remarks, created_by, event_time)
VALUES
-- Events for Shipment 5 (OUT_FOR_DELIVERY)
(5, 6, 'ORDER_CREATED', 'CREATED', 11.0168, 76.9558, 'Apex Logistics Center, Coimbatore', 'Shipping label created and manifests printed', 1, NOW() - INTERVAL '24 hours'),
(5, 6, 'PACKAGE_PICKED_UP', 'PICKED_UP', 11.0168, 76.9558, 'Coimbatore Central Hub', 'Collected package from merchant warehouse', 6, NOW() - INTERVAL '18 hours'),
(5, 6, 'IN_TRANSIT_SCAN', 'IN_TRANSIT', 12.5266, 78.2146, 'Salem-Vellore Highway NH44', 'Package is in transit on express line haul vehicle', 6, NOW() - INTERVAL '8 hours'),
(5, 6, 'HUB_ARRIVED', 'ARRIVED_AT_HUB', 13.0827, 80.2707, 'Chennai North Sorting Hub', 'Sorted into last-mile dispatch bay 04', 6, NOW() - INTERVAL '3 hours'),
(5, 6, 'OUT_FOR_DELIVERY', 'OUT_FOR_DELIVERY', 13.0418, 80.2341, 'T. Nagar Delivery Zone, Chennai', 'Dispatched with driver Ragu Nanthan on Tata Ace VEH-001', 6, NOW() - INTERVAL '40 minutes'),

-- Events for Shipment 7 (FAILED_DELIVERY)
(7, 6, 'ORDER_CREATED', 'CREATED', 12.9716, 77.5946, 'Bengaluru Sorting Hub', 'Order booked by Apex Fashion', 1, NOW() - INTERVAL '3 days'),
(7, 6, 'PACKAGE_PICKED_UP', 'PICKED_UP', 12.9716, 77.5946, 'Bengaluru Hub', 'Loaded onto interstate transit truck', 6, NOW() - INTERVAL '2 days'),
(7, 6, 'OUT_FOR_DELIVERY', 'OUT_FOR_DELIVERY', 11.0168, 76.9558, 'R.S. Puram, Coimbatore', 'Out for delivery with delivery agent', 6, NOW() - INTERVAL '8 hours'),
(7, 6, 'DELIVERY_ATTEMPT_1', 'FAILED_DELIVERY', 11.0168, 76.9558, 'Lake View Residency, R.S. Puram', 'Attempt 1 failed: Customer door locked, no response', 6, NOW() - INTERVAL '6 hours'),
(7, 6, 'DELIVERY_ATTEMPT_2', 'FAILED_DELIVERY', 11.0168, 76.9558, 'Lake View Residency, R.S. Puram', 'Attempt 2 failed: Customer phone switched off. Marked as Failed Delivery', 6, NOW() - INTERVAL '4 hours'),

-- Events for Shipment 11 (FAILED_DELIVERY)
(11, 6, 'ORDER_CREATED', 'CREATED', 19.0760, 72.8777, 'Mumbai Logistics Park', 'Cold-chain shipment initialized', 1, NOW() - INTERVAL '2 days'),
(11, 6, 'HUB_ARRIVED', 'ARRIVED_AT_HUB', 13.0827, 80.2707, 'Chennai Hub', 'Arrived at destination sorting center', 6, NOW() - INTERVAL '10 hours'),
(11, 6, 'OUT_FOR_DELIVERY', 'OUT_FOR_DELIVERY', 12.9815, 80.2180, 'Velachery Delivery Zone, Chennai', 'Driver dispatched to customer apartment complex', 6, NOW() - INTERVAL '4 hours'),
(11, 6, 'DELIVERY_FAILED', 'FAILED_DELIVERY', 12.9815, 80.2180, 'Green Meadows, Velachery', 'Attempt failed: Security denied entry without resident gate pass. Customer phone busy', 6, NOW() - INTERVAL '2 hours');

-- 6. Delivery Assignments
DELETE FROM delivery_assignments WHERE shipment_id IN (5, 6, 7, 9, 10, 11, 13, 15);

INSERT INTO delivery_assignments (shipment_id, driver_id, vehicle_id, assigned_by, assigned_at, accepted_at, completed_at, cancellation_reason, status)
VALUES
(5, 6, 1, 1, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '1 hour', NULL, NULL, 'IN_PROGRESS'),
(6, 6, 2, 1, NOW() - INTERVAL '36 hours', NOW() - INTERVAL '35 hours', NULL, NULL, 'IN_PROGRESS'),
(7, 6, 3, 1, NOW() - INTERVAL '8 hours', NOW() - INTERVAL '7 hours', NOW() - INTERVAL '4 hours', 'Premises locked & customer unreachable', 'COMPLETED'),
(9, 6, 1, 1, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '90 minutes', NULL, NULL, 'IN_PROGRESS'),
(10, 6, 1, 1, NOW() - INTERVAL '1 day', NOW() - INTERVAL '23 hours', NOW() - INTERVAL '6 hours', NULL, 'COMPLETED'),
(11, 6, 3, 1, NOW() - INTERVAL '6 hours', NOW() - INTERVAL '5 hours', NOW() - INTERVAL '2 hours', 'Gated community security refusal', 'COMPLETED'),
(13, 6, 4, 1, NOW() - INTERVAL '3 hours', NOW() - INTERVAL '2 hours', NULL, NULL, 'ACCEPTED'),
(15, 6, 1, 1, NOW() - INTERVAL '3 hours', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '1 hour', NULL, 'COMPLETED');

-- 7. Invoices (Billing Records)
INSERT INTO invoices (id, invoice_number, shipment_id, customer_id, company_id, subtotal, tax, discount, total_amount, payment_status, payment_method, issued_at, due_date, paid_at)
VALUES
(1, 'INV-2026-001', 5, 3, 1, 1250.00, 225.00, 50.00, 1425.00, 'PAID', 'UPI', NOW() - INTERVAL '1 day', NOW() + INTERVAL '14 days', NOW() - INTERVAL '1 day'),
(2, 'INV-2026-002', 6, 3, 1, 2800.00, 504.00, 0.00, 3304.00, 'PAID', 'CREDIT_CARD', NOW() - INTERVAL '2 days', NOW() + INTERVAL '12 days', NOW() - INTERVAL '2 days'),
(3, 'INV-2026-003', 7, 3, 1, 650.00, 117.00, 0.00, 767.00, 'PENDING', 'CASH_ON_DELIVERY', NOW() - INTERVAL '3 days', NOW() + INTERVAL '5 days', NULL),
(4, 'INV-2026-004', 9, 4, 1, 850.00, 153.00, 0.00, 1003.00, 'PAID', 'NET_BANKING', NOW() - INTERVAL '1 day', NOW() + INTERVAL '14 days', NOW() - INTERVAL '1 day'),
(5, 'INV-2026-005', 10, 4, 1, 1800.00, 324.00, 100.00, 2024.00, 'PAID', 'UPI', NOW() - INTERVAL '3 days', NOW() + INTERVAL '10 days', NOW() - INTERVAL '3 days'),
(6, 'INV-2026-006', 11, 4, 1, 1100.00, 198.00, 0.00, 1298.00, 'PENDING', 'CREDIT_CARD', NOW() - INTERVAL '2 days', NOW() + INTERVAL '7 days', NULL),
(7, 'INV-2026-007', 15, 3, 1, 950.00, 171.00, 0.00, 1121.00, 'PAID', 'UPI', NOW() - INTERVAL '1 day', NOW() + INTERVAL '14 days', NOW() - INTERVAL '1 hour')
ON CONFLICT (id) DO UPDATE SET 
  payment_status = EXCLUDED.payment_status,
  total_amount = EXCLUDED.total_amount;

SELECT setval('invoices_id_seq', (SELECT COALESCE(MAX(id), 1) FROM invoices));

-- 8. Support Tickets in PostgreSQL
INSERT INTO support_tickets (id, ticket_number, customer_id, shipment_id, assigned_to, subject, description, category, priority, status, resolved_at, created_at, updated_at)
VALUES
(1, 'TKT-4821', 3, 5, 5, 'When will my MacBook arrive in Anna Nagar?', 'Package TRK-88A1901B is showing out for delivery. I need to make sure I am home to receive it.', 'Delivery Delay', 'HIGH', 'IN_PROGRESS', NULL, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '30 minutes'),
(2, 'TKT-4822', 3, 7, 5, 'Delivery attempt failed on TRK-55F8102C - Can I reschedule?', 'Driver marked my package as failed delivery. My doorbell was silent. Please reattempt delivery tomorrow morning after 10 AM.', 'Failed Delivery', 'URGENT', 'OPEN', NULL, NOW() - INTERVAL '3 hours', NOW() - INTERVAL '1 hour'),
(3, 'TKT-4823', 4, 11, 5, 'Security access gate issue for TRK-61A1187P medical kit', 'The security guard refused entry to the delivery driver. I have now registered visitor pass code #4491 at the front gate.', 'Failed Delivery', 'URGENT', 'IN_PROGRESS', NULL, NOW() - INTERVAL '1 hour', NOW() - INTERVAL '20 minutes'),
(4, 'TKT-4824', 4, 10, 5, 'Request digital copy of delivery signature for TRK-22E9043M', 'Chair was delivered today. Need the verified POD copy for office expense reimbursement.', 'Proof of Delivery', 'NORMAL', 'RESOLVED', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '5 hours', NOW() - INTERVAL '2 hours'),
(5, 'TKT-4825', 3, 6, NULL, 'Expected delivery date check for Sony 65" TV', 'Shipping from Mumbai to Chennai. Can you verify highway weather delays?', 'Delivery Delay', 'NORMAL', 'OPEN', NULL, NOW() - INTERVAL '12 hours', NOW() - INTERVAL '12 hours')
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  subject = EXCLUDED.subject,
  description = EXCLUDED.description;

SELECT setval('support_tickets_id_seq', (SELECT COALESCE(MAX(id), 1) FROM support_tickets));

-- Ticket Messages
DELETE FROM ticket_messages WHERE ticket_id IN (1, 2, 3, 4, 5);

INSERT INTO ticket_messages (ticket_id, sender_id, message, created_at)
VALUES
(1, 3, 'Hi support team, my shipment TRK-88A1901B shows Out for Delivery. What is the approximate ETA window?', NOW() - INTERVAL '2 hours'),
(1, 5, 'Hello Manju! Support Agent Hema here. Your delivery agent Ragu Nanthan is currently on T. Nagar Main Road and is estimated to reach you within 45 minutes.', NOW() - INTERVAL '30 minutes'),
(2, 3, 'My delivery TRK-55F8102C was marked as Failed Delivery. Please do not return to sender! Can you reattempt tomorrow?', NOW() - INTERVAL '3 hours'),
(3, 4, 'Hello, security blocked the driver at Green Meadows gate. I have given visitor code 4491 at security desk. Please tell driver to reattempt.', NOW() - INTERVAL '1 hour'),
(3, 5, 'Understood Priya! I have notified Logistics Operator Ragu Nanthan with your gate pass code 4491. Reattempt is being scheduled.', NOW() - INTERVAL '20 minutes'),
(4, 4, 'Hi, please send the verified POD receipt for TRK-22E9043M.', NOW() - INTERVAL '5 hours'),
(4, 5, 'Hi Priya, your POD has been verified and is available directly under your Shipment Details page. Resolving this ticket.', NOW() - INTERVAL '2 hours');

-- 9. Key Notifications
INSERT INTO notifications (user_id, shipment_id, channel, title, message, priority, is_read, sent_at, created_at, event_type)
VALUES
-- Customer 3 Manju
(3, 5, 'IN_APP', 'Out for Delivery 🚚', 'Your Apple MacBook Pro (TRK-88A1901B) is out for delivery with driver Ragu Nanthan. Estimated arrival in 45 mins!', 'HIGH', false, NOW() - INTERVAL '40 minutes', NOW() - INTERVAL '40 minutes', 'OUT_FOR_DELIVERY'),
(3, 7, 'IN_APP', 'Delivery Attempt Failed ⚠️', 'Delivery attempt 2 failed for package TRK-55F8102C. Customer door was locked. Please reschedule.', 'HIGH', false, NOW() - INTERVAL '4 hours', NOW() - INTERVAL '4 hours', 'FAILED_DELIVERY'),
(3, 15, 'IN_APP', 'Package Delivered 🎉', 'Your package TRK-10P3948V has been successfully delivered to Kavitha Arul.', 'NORMAL', true, NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 hour', 'DELIVERED'),

-- Customer 4 Priya Bala
(4, 9, 'IN_APP', 'Out for Delivery 🚀', 'Your iPad Air (TRK-44B6631Z) is on the delivery van! Driver is entering Velachery zone.', 'HIGH', false, NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 hour', 'OUT_FOR_DELIVERY'),
(4, 11, 'IN_APP', 'Action Required: Delivery Exception ⚠️', 'Package TRK-61A1187P could not be delivered due to gate security code requirement.', 'HIGH', false, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours', 'FAILED_DELIVERY'),
(4, 10, 'IN_APP', 'Package Delivered Successfully ✅', 'Executive Chair (TRK-22E9043M) has been delivered and POD verified.', 'NORMAL', true, NOW() - INTERVAL '6 hours', NOW() - INTERVAL '6 hours', 'DELIVERED'),

-- Business Client 2 Tharun
(2, 5, 'IN_APP', 'B2B Dispatch Update', 'Express shipment TRK-88A1901B has reached last-mile delivery in Chennai.', 'NORMAL', false, NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 hour', 'STATUS_UPDATE'),
(2, 7, 'IN_APP', 'Failed Delivery Alert', 'Customer package TRK-55F8102C failed attempt 2 in Coimbatore. Proactive retry scheduled.', 'HIGH', false, NOW() - INTERVAL '4 hours', NOW() - INTERVAL '4 hours', 'FAILED_DELIVERY'),

-- Operator 6 Ragu
(6, 5, 'IN_APP', 'Active Delivery Assignment', 'You have 4 active deliveries scheduled today in Chennai zone on vehicle VEH-001.', 'NORMAL', false, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours', 'ASSIGNMENT'),
(6, 15, 'IN_APP', 'POD Upload Confirmed', 'POD for TRK-10P3948V submitted and pending verification.', 'NORMAL', false, NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 hour', 'POD_SUBMITTED'),

-- Admin 1 Manjari
(1, 15, 'IN_APP', 'Pending POD Verification', 'New Proof of Delivery submitted for TRK-10P3948V requires administrative review.', 'NORMAL', false, NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 hour', 'POD_PENDING'),
(1, 7, 'IN_APP', 'High Risk Delivery Exception', 'Shipment TRK-55F8102C marked as Failed Delivery (2nd attempt). AI Risk model alert triggered.', 'HIGH', false, NOW() - INTERVAL '4 hours', NOW() - INTERVAL '4 hours', 'RISK_ALERT');

COMMIT;
