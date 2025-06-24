from flask import Blueprint, request, jsonify
import psycopg2
from psycopg2.extras import RealDictCursor
import os

search_bp = Blueprint("search", __name__) #Define a blueprint

#Load DB credentials
file_path = "C:\wamp64\www\market_analytics\webMapping-Application\services\db.credentials"

# file_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".\db_credentials")
with open(file_path) as f:
    conn_str = f.readline().strip()
 
@search_bp.route('/search_markets', methods=['GET', 'POST'])
def search_markets():
    try:
        # Get query parameters
        centroid = request.values.get('location');
        centroid = centroid.split(",")
        radius = request.values.get('distance');
        srid = request.values.get('srid');

        # Connect to PostgreSQL
        pg_conn = psycopg2.connect(conn_str);
        pg_cur = pg_conn.cursor(cursor_factory=RealDictCursor)

        # Execute query
        query = f"""
            SELECT name, categorie,  ST_AsGeoJSON(ST_Transform(geom, %s)) AS geom
            FROM vector.bi_markets AS a
            WHERE ST_DWithin(
                ST_Transform(a.geom, %s),
                ST_Transform(ST_SetSRID(ST_MakePoint(%s, %s), %s), %s),
                %s)
        """% (
            int(srid), int(srid),
            float(centroid[0]), float(centroid[1]), int(srid), int(srid),
            float(radius) * 1000.0
        )

        pg_cur.execute(query)

        records = pg_cur.fetchall()
        pg_conn.close()

        if(records):
            return jsonify(records)
        else :
            return "No data found", 404


    except Exception as e:
        return f"Error: {str(e)}", 500
