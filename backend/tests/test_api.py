import unittest
import json
import urllib.request
import urllib.error

BASE_URL = "http://127.0.0.1:8000/api/v1"

class TestPhillipAssetManagementAPI(unittest.TestCase):
    def test_01_health_check(self):
        res = urllib.request.urlopen("http://127.0.0.1:8000/health")
        self.assertEqual(res.status, 200)
        data = json.loads(res.read().decode())
        self.assertEqual(data["status"], "online")

    def test_02_dashboard_kpis(self):
        res = urllib.request.urlopen(f"{BASE_URL}/dashboard/stats")
        self.assertEqual(res.status, 200)
        data = json.loads(res.read().decode())
        self.assertEqual(data["total_assets"], 1248)
        self.assertEqual(data["company_owned"], 876)
        self.assertEqual(data["rental_leased"], 372)
        self.assertEqual(data["active_contracts"], 32)
        self.assertEqual(data["total_vendors"], 14)
        self.assertEqual(data["total_locations"], 6)
        self.assertEqual(data["devices_in_maintenance"], 6)
        self.assertEqual(data["warranties_expiring_90d"], 14)
        self.assertEqual(len(data["asset_distribution"]), 5)

    def test_03_assets_pagination_and_reference_item(self):
        res = urllib.request.urlopen(f"{BASE_URL}/assets?page=1&page_size=6")
        self.assertEqual(res.status, 200)
        data = json.loads(res.read().decode())
        self.assertEqual(data["total"], 1248)
        self.assertEqual(len(data["items"]), 6)
        
        # Verify first asset matches visual reference screenshot
        first = data["items"][0]
        self.assertEqual(first["asset_id"], "NA-000123")
        self.assertEqual(first["hostname"], "FW-01-HK")
        self.assertEqual(first["model_name"], "PA-3220")
        self.assertEqual(first["operational_status"], "Deployed")

    def test_04_asset_detail_7_tabs(self):
        res = urllib.request.urlopen(f"{BASE_URL}/assets/NA-000123")
        self.assertEqual(res.status, 200)
        data = json.loads(res.read().decode())
        self.assertEqual(data["asset_id"], "NA-000123")
        self.assertIn("contracts", data)
        self.assertIn("warranties", data)
        self.assertIn("interfaces", data)
        self.assertIn("maintenance_history", data)
        self.assertIn("documents", data)
        self.assertIn("audit_history", data)
        self.assertIn("topology_neighbors", data)

    def test_05_contracts_and_expirations(self):
        res = urllib.request.urlopen(f"{BASE_URL}/contracts?page=1&page_size=10")
        self.assertEqual(res.status, 200)
        data = json.loads(res.read().decode())
        self.assertGreaterEqual(data["total"], 32)

    def test_06_vendors_directory(self):
        res = urllib.request.urlopen(f"{BASE_URL}/vendors")
        self.assertEqual(res.status, 200)
        data = json.loads(res.read().decode())
        self.assertEqual(data["total"], 14)

    def test_07_locations_hierarchy(self):
        res = urllib.request.urlopen(f"{BASE_URL}/locations")
        self.assertEqual(res.status, 200)
        data = json.loads(res.read().decode())
        self.assertEqual(len(data), 6)

    def test_08_topology_graph(self):
        res = urllib.request.urlopen(f"{BASE_URL}/topology")
        self.assertEqual(res.status, 200)
        data = json.loads(res.read().decode())
        self.assertIn("nodes", data)
        self.assertIn("edges", data)
        self.assertGreater(len(data["nodes"]), 0)

    def test_09_ipam_vlans_and_addresses(self):
        res = urllib.request.urlopen(f"{BASE_URL}/ipam/vlans")
        self.assertEqual(res.status, 200)
        data = json.loads(res.read().decode())
        self.assertGreaterEqual(len(data), 5)

    def test_10_reports_catalog(self):
        res = urllib.request.urlopen(f"{BASE_URL}/reports/types")
        self.assertEqual(res.status, 200)
        data = json.loads(res.read().decode())
        self.assertEqual(len(data), 12)

    def test_11_csv_export(self):
        res = urllib.request.urlopen(f"{BASE_URL}/assets/export/csv")
        self.assertEqual(res.status, 200)
        content = res.read().decode("utf-8")
        self.assertIn("Asset ID,Hostname,Model", content)
        self.assertIn("NA-000123", content)

    def test_12_alert_rules_and_automation(self):
        # 1. Fetch rules
        res = urllib.request.urlopen(f"{BASE_URL}/alerts/rules")
        self.assertEqual(res.status, 200)
        rules = json.loads(res.read().decode())
        self.assertGreaterEqual(len(rules), 6)

        # 2. Check summary
        res = urllib.request.urlopen(f"{BASE_URL}/alerts/summary")
        self.assertEqual(res.status, 200)
        summary = json.loads(res.read().decode())
        self.assertIn("total_rules", summary)
        self.assertEqual(summary["total_rules"], 6)

        # 3. Trigger evaluation
        req = urllib.request.Request(
            f"{BASE_URL}/alerts/evaluate-now",
            data=b"{}",
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        res = urllib.request.urlopen(req)
        self.assertEqual(res.status, 200)
        eval_res = json.loads(res.read().decode())
        self.assertTrue(eval_res["success"])
        self.assertGreaterEqual(eval_res["evaluated_rules_count"], 6)

        # 4. Check test dispatch
        req_test = urllib.request.Request(
            f"{BASE_URL}/alerts/rules/1/test",
            data=json.dumps({"custom_message": "PyTest NOC Validation"}).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        res_test = urllib.request.urlopen(req_test)
        self.assertEqual(res_test.status, 200)
        test_data = json.loads(res_test.read().decode())
        self.assertTrue(test_data["success"])

if __name__ == "__main__":
    unittest.main()

