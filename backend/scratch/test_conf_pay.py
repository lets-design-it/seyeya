import sys
import os
import asyncio

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from scratch.test_all_modules_email import test_module_conference, test_module_payments, results

async def main():
    await test_module_conference()
    await test_module_payments()
    print("--------------------------------------------------")
    print("RESULTS:")
    print("Passed:", results["passed"])
    print("Failed:", results["failed"])
    print("--------------------------------------------------")

if __name__ == "__main__":
    asyncio.run(main())
