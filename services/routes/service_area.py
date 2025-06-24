from flask import Blueprint, request, jsonify
import psycopg2
from psycopg2.extras import RealDictCursor
import os

service_bp = Blueprint("service", __name__) #Define a blueprint

#Load DB credentials
file_path = "C:\wamp64\www\market_analytics\webMapping-Application\services\db.credentials"

# file_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".\db_credentials")
with open(file_path) as f:
    conn_str = f.readline().strip()
 
@service_bp.route('/get_area', methods=['GET', 'POST'])
def get_area():
    try:
        # Get query parameters
        coord = request.values.get('location');
        coord = coord.split(",")
        size_value = request.values.get('size');
        srid_value = request.values.get('srid');

        longitude = float(coord[0])
        latitude = float(coord[1])
        srid = int(srid_value)
    
        # Connect to PostgreSQL
        pg_conn = psycopg2.connect(conn_str);
        pg_cur = pg_conn.cursor(cursor_factory=RealDictCursor)

        # Execute query
        query = f"""
            SELECT name, ST_AsGeoJSON(ST_Transform(geom, %s)) AS geom
            FROM vector.bi_{size_value} AS a
            WHERE ST_Intersects(
                a.geom,
                ST_Transform(
                    ST_SetSRID(ST_MakePoint(%s, %s), %s),
                    ST_SRID(a.geom)
                )
            )
        """
        params = (srid, longitude, latitude, srid)
        pg_cur.execute(query,params)

        records = pg_cur.fetchall()
        pg_conn.close()

        if(records):
            return jsonify(records)
        else :
            return "No data found", 404


    except Exception as e:
        return f"Error: {str(e)}", 500
