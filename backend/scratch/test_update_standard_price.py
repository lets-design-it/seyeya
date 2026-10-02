import urllib.request
import json

url = "http://localhost:8000/api/v1/conference/halls/20"
data = json.dumps({"standard_price": 500000}).encode("utf-8")
req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"}, method="PUT")

try:
    with urllib.request.urlopen(req) as response:
        print("Status Code:", response.getcode())
        res_body = json.loads(response.read().decode())
        print("Updated Standard Price:", res_body.get("standard_price"))
except Exception as e:
    print("Error:", e)
