import json
import urllib.request
import os

class NeonDB:
    def __init__(self, api_url=None, api_key=None):
        self.api_url = api_url or os.environ.get('NEON_API_URL')
        self.api_key = api_key or os.environ.get('NEON_API_KEY')

    def save_workout(self, data):
        """
        Saves workout data to the Neon Data API.
        Assumes a table named 'workouts' exists.
        """
        if not self.api_url:
            print("[DB] Error: NEON_API_URL not set")
            return False

        url = f"{self.api_url}/workouts"
        
        try:
            req = urllib.request.Request(url, method='POST')
            req.add_header('Content-Type', 'application/json')
            req.add_header('Prefer', 'return=representation')
            if self.api_key:
                req.add_header('Authorization', f'Bearer {self.api_key}')
            
            payload = json.dumps(data).encode('utf-8')
            
            with urllib.request.urlopen(req, data=payload) as response:
                result = json.loads(response.read().decode('utf-8'))
                print(f"[DB] Successfully saved workout: {result}")
                return True
        except Exception as e:
            print(f"[DB] Failed to save workout: {e}")
            return False

    def get_workouts(self, user_id=None):
        """
        Fetches workouts from Neon.
        """
        if not self.api_url:
            return []

        url = f"{self.api_url}/workouts"
        if user_id:
            url += f"?user_id=eq.{user_id}"

        try:
            req = urllib.request.Request(url, method='GET')
            if self.api_key:
                req.add_header('Authorization', f'Bearer {self.api_key}')
            
            with urllib.request.urlopen(req) as response:
                return json.loads(response.read().decode('utf-8'))
        except Exception as e:
            print(f"[DB] Failed to fetch workouts: {e}")
            return []
