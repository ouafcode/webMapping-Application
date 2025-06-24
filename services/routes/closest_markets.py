from flask import Blueprint, request, jsonify
import psycopg2
from psycopg2.extras import RealDictCursor
import os

closet_bp = Blueprint("close", __name__) #Define a blueprint

#Load DB credentials
file_path = "C:\wamp64\www\market_analytics\webMapping-Application\services\db.credentials"

# file_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".\db_credentials")
with open(file_path) as f:
    conn_str = f.readline().strip()

@closet_bp.route('/closet_market', methods=['GET', 'POST'])
def closet_market():
    try:
        #Get query parameters
        coord = request.values.get("location");
        srid = int(request.values.get('srid'));

        coord = coord.split(",");

        # Connect to PostgreSQL
        pg_conn = psycopg2.connect(conn_str);
        pg_cur = pg_conn.cursor(cursor_factory=RealDictCursor)

        query = """
            SELECT a.gid, b.pop_2020::integer, a.name, b.categorie, st_asgeojson(st_transform(b.geom, 3857)) as geometry
                FROM vector.bi_small_areas as a JOIN vector.bi_markets as b 
                ON st_intersects(a.geom, b.geom) AND b.categorie = 'small_markets' 
                WHERE st_intersects(a.geom, ST_Transform(ST_GeomFromText('POINT(%s %s)', %d), st_srid(a.geom)))
            union
            SELECT distinct a.gid, b.pop_2020::integer, a.name, b.categorie, st_asgeojson(st_transform(b.geom, 3857))  as geometry
                FROM vector.bi_medium_areas as a JOIN vector.bi_markets as b 
                ON st_intersects(a.geom, b.geom) AND b.categorie = 'medium_markets' 
                WHERE st_intersects(a.geom, ST_Transform(ST_GeomFromText('POINT(%s %s)', %d), st_srid(a.geom)))
            union
            SELECT a.gid, b.pop_2020::integer, a.name, b.categorie, st_asgeojson(st_transform(b.geom, 3857))  as geometry
                FROM vector.bi_local_areas as a JOIN vector.bi_markets as b 
                ON st_intersects(a.geom, b.geom) AND b.categorie = 'local_markets' 
                WHERE st_intersects(a.geom, ST_Transform(ST_GeomFromText('POINT(%s %s)', %d), st_srid(a.geom)))
            union
            SELECT a.gid, b.pop_2020::integer, a.name, b.categorie, st_asgeojson(st_transform(b.geom, 3857))  as geometry
                FROM vector.bi_capital_areas as a JOIN vector.bi_markets as b 
                ON st_intersects(a.geom, b.geom) AND b.categorie = 'capital_markets' 
                WHERE st_intersects(a.geom, ST_Transform(ST_GeomFromText('POINT(%s %s)', %d), st_srid(a.geom)))
        """ % (float(coord[0]), float(coord[1]), int(srid), 
                float(coord[0]), float(coord[1]), int(srid), 
                float(coord[0]), float(coord[1]), int(srid), 
                float(coord[0]), float(coord[1]), int(srid))
        
        pg_cur.execute(query)

        records = pg_cur.fetchall()
        pg_conn.close()

        if(records):
            return jsonify(records)
        else :
            return "No data found", 404


    except Exception as e:
        return f"Error: {str(e)}", 500
