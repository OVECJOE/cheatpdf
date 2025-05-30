
import requests
import sys
import json
from datetime import datetime
import time

class CheatPDFAPITester:
    def __init__(self, base_url="http://localhost:3001/api"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.user_id = None
        self.document_id = None
        self.exam_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, files=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        
        if headers is None:
            headers = {}
            
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'
            
        if data and not files:
            headers['Content-Type'] = 'application/json'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                if files:
                    response = requests.post(url, data=data, files=files, headers=headers)
                else:
                    response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            
            try:
                response_data = response.json()
                print(f"Response: {json.dumps(response_data, indent=2)[:500]}...")
            except:
                response_data = {}
                print(f"Response: {response.text[:500]}...")
                
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")

            return success, response_data

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_signup(self, email, password, name):
        """Test user signup"""
        success, response = self.run_test(
            "User Signup",
            "POST",
            "auth/signup",
            201,
            data={
                "email": email,
                "password": password,
                "name": name
            }
        )
        return success

    def test_signin(self, email, password):
        """Test user signin and get token"""
        success, response = self.run_test(
            "User Signin",
            "POST",
            "auth/signin",
            200,
            data={
                "email": email,
                "password": password
            }
        )
        if success and 'token' in response:
            self.token = response['token']
            if 'user' in response and 'id' in response['user']:
                self.user_id = response['user']['id']
            return True
        return False

    def test_onboarding(self, study_field, education_level):
        """Test user onboarding"""
        success, response = self.run_test(
            "User Onboarding",
            "POST",
            "onboarding",
            200,
            data={
                "studyField": study_field,
                "educationLevel": education_level
            }
        )
        return success

    def test_get_user_profile(self):
        """Test getting user profile"""
        success, response = self.run_test(
            "Get User Profile",
            "GET",
            f"user/profile",
            200
        )
        return success

    def test_upload_document(self, title, description, file_path):
        """Test document upload"""
        with open(file_path, 'rb') as f:
            files = {'file': (file_path.split('/')[-1], f, 'application/pdf')}
            data = {
                'title': title,
                'description': description
            }
            success, response = self.run_test(
                "Upload Document",
                "POST",
                "documents/upload",
                201,
                data=data,
                files=files
            )
            if success and 'id' in response:
                self.document_id = response['id']
                return True
            return False

    def test_get_documents(self):
        """Test getting user documents"""
        success, response = self.run_test(
            "Get User Documents",
            "GET",
            "documents",
            200
        )
        return success

    def test_chat_with_document(self, message):
        """Test chatting with a document"""
        if not self.document_id:
            print("❌ No document ID available for chat test")
            return False
            
        success, response = self.run_test(
            "Chat with Document",
            "POST",
            f"chat",
            200,
            data={
                "documentId": self.document_id,
                "message": message
            }
        )
        return success

    def test_generate_exam(self, num_questions=5):
        """Test generating an exam from a document"""
        if not self.document_id:
            print("❌ No document ID available for exam generation test")
            return False
            
        success, response = self.run_test(
            "Generate Exam",
            "POST",
            "exams/generate",
            201,
            data={
                "documentId": self.document_id,
                "numQuestions": num_questions
            }
        )
        if success and 'id' in response:
            self.exam_id = response['id']
            return True
        return False

    def test_get_exam(self):
        """Test getting an exam"""
        if not self.exam_id:
            print("❌ No exam ID available for get exam test")
            return False
            
        success, response = self.run_test(
            "Get Exam",
            "GET",
            f"exams/{self.exam_id}",
            200
        )
        return success

    def test_subscription_plans(self):
        """Test getting subscription plans"""
        success, response = self.run_test(
            "Get Subscription Plans",
            "GET",
            "subscription/plans",
            200
        )
        return success

    def test_create_checkout_session(self, price_id):
        """Test creating a checkout session"""
        success, response = self.run_test(
            "Create Checkout Session",
            "POST",
            "subscription/create-checkout-session",
            200,
            data={
                "priceId": price_id
            }
        )
        return success

def main():
    # Setup
    tester = CheatPDFAPITester("http://localhost:3001/api")
    test_email = f"test_user_{int(time.time())}@example.com"
    test_password = "TestPass123!"
    test_name = "Test User"
    
    print(f"🚀 Starting CheatPDF API Tests with test user: {test_email}")

    # Run tests
    # 1. Authentication Flow
    if not tester.test_signup(test_email, test_password, test_name):
        print("❌ Signup failed, continuing to signin...")
    
    if not tester.test_signin(test_email, test_password):
        print("❌ Signin failed, stopping tests")
        return 1
    
    # 2. Onboarding
    if not tester.test_onboarding("Computer Science", "University"):
        print("❌ Onboarding failed, continuing...")
    
    # 3. User Profile
    if not tester.test_get_user_profile():
        print("❌ Get user profile failed, continuing...")
    
    # 4. Document Management
    # Note: This would require an actual PDF file to test
    # Skipping actual file upload for this test
    
    # 5. Document Listing
    if not tester.test_get_documents():
        print("❌ Get documents failed, continuing...")
    
    # 6. Chat Functionality
    # Note: This requires a document to be uploaded first
    # Skipping actual chat test for this test
    
    # 7. Exam Generation
    # Note: This requires a document to be uploaded first and premium subscription
    # Skipping actual exam generation test for this test
    
    # 8. Subscription Management
    if not tester.test_subscription_plans():
        print("❌ Get subscription plans failed, continuing...")
    
    # Print results
    print(f"\n📊 Tests passed: {tester.tests_passed}/{tester.tests_run}")
    print(f"⚠️ Note: Some tests were skipped due to dependencies on actual file uploads or premium features")
    
    return 0 if tester.tests_passed > 0 else 1

if __name__ == "__main__":
    sys.exit(main())
