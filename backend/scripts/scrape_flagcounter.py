import requests
from bs4 import BeautifulSoup
import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

# Configuration
JOURNAL_ID = 1 # TJPSD
DETAILS_URL = 'https://s01.flagcounter.com/countries/6Axm/'
HISTORY_URL = 'https://s01.flagcounter.com/more30/6Axm/'
DB_URL = os.getenv('DATABASE_URL')

def scrape_tjpsd():
    print('🚀 Starting Python Deep Historical Recovery for TJPSD (6Axm)...')
    
    try:
        # 1. Scrape Country Details (BeautifulSoup)
        print(f'🔍 Fetching Country Details: {DETAILS_URL}')
        response = requests.get(DETAILS_URL, headers={'User-Agent': 'Mozilla/5.0'})
        soup = BeautifulSoup(response.text, 'html.parser')
        
        countries = []
        # Finding the main data table
        # Structure: <tr> <td>Rank</td> <td>Flag</td> <td><u>Country</u></td> ... <td>Hits</td> </tr>
        table = soup.find('table', {'cellspacing': '5'})
        if table:
            for row in table.find_all('tr'):
                u_tag = row.find('u')
                if u_tag:
                    country_name = u_tag.get_text(strip=True)
                    tds = row.find_all('td')
                    if len(tds) >= 5:
                        hits_text = tds[4].get_text(strip=True).replace(',', '')
                        hits = int(hits_text) if hits_text.isdigit() else 0
                        
                        last_visitor = tds[7].get_text(strip=True) if len(tds) >= 8 else "Unknown"
                        
                        if hits > 0:
                            countries.append({
                                'name': country_name,
                                'hits': hits,
                                'last_visitor': last_visitor
                            })

        print(f'📊 Found {len(countries)} countries via Python.')
        
        # 2. Database Persistence (Psycopg2)
        if DB_URL:
            conn = psycopg2.connect(DB_URL)
            cur = conn.cursor()
            
            # Clear previous historical entries
            cur.execute("DELETE FROM readership_geodata WHERE journal_id = %s AND event_type = 'historical_baseline'", (JOURNAL_ID,))
            
            for country in countries:
                cur.execute(
                    """
                    INSERT INTO readership_geodata (
                        journal_id, country_name, event_type, session_duration, location_point, timestamp
                    ) VALUES (%s, %s, 'historical_baseline', 0, ST_SetSRID(ST_MakePoint(34.8, -6.3), 4326), NOW())
                    """,
                    (JOURNAL_ID, country['name'])
                )
            
            conn.commit()
            cur.close()
            conn.close()
            print('✅ Python Data Recovery successfully persisted.')
            
    except Exception as e:
        print(f'❌ Python Scraper Failed: {e}')

if __name__ == '__main__':
    scrape_tjpsd()
