#!/usr/bin/env python3
"""
Simple test script to verify GST validation changes
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from app.schemas.customer import CustomerCreate
from app.schemas.agency import AgencyCreate

def test_gst_validation():
    """Test that GST validation accepts any valid Indian GST number format"""
    
    print("Testing GST validation changes...")
    
    # Test valid GST numbers with different state codes
    valid_gst_numbers = [
        "22ABCDE1234567",  # Original format (still valid)
        "27ABCDE1234567",  # Maharashtra
        "33ABCDE1234567",  # Tamil Nadu
        "11ABCDE1234567",  # Delhi
        "06ABCDE1234567",  # Haryana
    ]
    
    # Test invalid GST numbers
    invalid_gst_numbers = [
        "123456789012345",  # All digits (should fail)
        "ABCDEF123456789",  # All letters (should fail)
        "22ABCDE123456",    # Too short
        "22ABCDE12345678",  # Too long
        "2ABCDE123456789",  # Wrong format
    ]
    
    print("\nTesting valid GST numbers:")
    for gst in valid_gst_numbers:
        try:
            # Test customer schema
            customer_data = {
                "store_name": "Test Store",
                "referrer": "Nagarajan",
                "owner_mobile": "9876543210",
                "accounts_mobile": "9876543211",
                "days_of_payment": 30,
                "gst_number": gst,
                "address": "Test Address",
                "pincode": "123456"
            }
            customer = CustomerCreate(**customer_data)
            print(f"✓ Customer GST {gst} - VALID")
            
            # Test agency schema
            agency_data = {
                "agency_name": "Test Agency",
                "owner_mobile": "9876543210",
                "accounts_mobile": "9876543211",
                "days_of_payment": 30,
                "gst_number": gst,
                "address": "Test Address",
                "pincode": "123456",
                "region_covered": "Test Region"
            }
            agency = AgencyCreate(**agency_data)
            print(f"✓ Agency GST {gst} - VALID")
            
        except Exception as e:
            print(f"✗ GST {gst} - INVALID: {e}")
    
    print("\nTesting invalid GST numbers:")
    for gst in invalid_gst_numbers:
        try:
            # Test customer schema
            customer_data = {
                "store_name": "Test Store",
                "referrer": "Nagarajan",
                "owner_mobile": "9876543210",
                "accounts_mobile": "9876543211",
                "days_of_payment": 30,
                "gst_number": gst,
                "address": "Test Address",
                "pincode": "123456"
            }
            customer = CustomerCreate(**customer_data)
            print(f"✗ Customer GST {gst} - SHOULD BE INVALID but was accepted")
            
        except Exception as e:
            print(f"✓ Customer GST {gst} - CORRECTLY REJECTED: {e}")
        
        try:
            # Test agency schema
            agency_data = {
                "agency_name": "Test Agency",
                "owner_mobile": "9876543210",
                "accounts_mobile": "9876543211",
                "days_of_payment": 30,
                "gst_number": gst,
                "address": "Test Address",
                "pincode": "123456",
                "region_covered": "Test Region"
            }
            agency = AgencyCreate(**agency_data)
            print(f"✗ Agency GST {gst} - SHOULD BE INVALID but was accepted")
            
        except Exception as e:
            print(f"✓ Agency GST {gst} - CORRECTLY REJECTED: {e}")
    
    print("\n✅ GST validation test completed!")

if __name__ == "__main__":
    test_gst_validation() 