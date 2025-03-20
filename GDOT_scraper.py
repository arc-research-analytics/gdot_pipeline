import asyncio
import pandas as pd
from playwright.async_api import async_playwright

# Input and output file paths
INPUT_CSV = "GDOT_export.csv"
OUTPUT_CSV = "gdot_scraped_data.csv"

df = pd.read_csv(INPUT_CSV)
df = df[df['Project_ID'] == '0016106']

# Create an empty list to store scraped data
all_data = []


async def scrape_project_data():
    # Start async Playwright
    async with async_playwright() as p:
        # Launch a browser (headless mode for speed)
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # Loop through each project URL
        for index, row in df.iterrows():
            project_id = row["Project_ID"]
            project_url = row["Project_URL"]

            print(f"Scraping Project ID: {project_id}...")

            # Open the project page
            await page.goto(project_url)

            # Select all rows inside the tbody
            rows = await page.query_selector_all("table.rgMasterTable tbody tr")

            # Wait for the table to load before scraping
            try:
                await page.wait_for_selector("table.rgMasterTable", timeout=15000)
            except:
                print(
                    f"Table not found for Project ID {project_id}. Skipping...")
                continue

            # Get all rows from the table's <tbody> section
            rows = await page.query_selector_all("table.rgMasterTable tbody tr")

            for row in rows:
                cells = await row.query_selector_all("td")
                cell_data = [await cell.inner_text() for cell in cells]

                # Clean non-breaking spaces and weird characters
                clean_data = [cell.replace("\xa0", " ").replace(
                    "¬†", "").strip() for cell in cell_data]

                # Add Project_ID and Project_URL to the start of the row
                if len(clean_data) == 4:
                    all_data.append([project_id, project_url] + clean_data)

        # Close the browser after scraping
        await browser.close()


# Run the scraper
asyncio.run(scrape_project_data())

# Define the column headers
columns = ["Project_ID", "Project_URL", "Activity",
           "Program Year", "Cost Estimate", "Date of Last Estimate"]

# Create DataFrame and drop duplicate/empty rows
clean_df = pd.DataFrame(all_data, columns=columns)

# Drop empty rows or unnecessary ones
clean_df = clean_df.replace("", pd.NA).dropna(how="all", subset=columns[2:])

# reformat the 'Cost Estimate' column
clean_df['Cost Estimate'] = clean_df['Cost Estimate'].str.replace(
    '$', '').str.replace(',', '').astype(float)

# Save cleaned data to a new CSV
clean_df.to_csv("GDOT_scraped_data_cleaned.csv", index=False)

print("✅ Scraping complete! Data cleaned and saved as 'GDOT_scraped_data_cleaned.csv'")
