 # coding=UTF-8
import gdal
from subprocess import call
from subprocess import Popen
import os
from os import *
from os.path import *
from osgeo import osr, gdal
import io
import csv
import sys


exec_do_tiff = False
exec_do_tiles = False 
exec_get_corners = True
exec_do_zoning = False
exec_do_index = True
exec_restrict_files= True

locations={}

foundFiles = {}
corners = {}
indexes = {}

citiesWithIndex=0

special_characters={
    u"á":u"a", u"é":u"e", u"í":u"i", u"ó":u"o", u"ú":u"u",
    u"Á":u"a", u"É":u"e", u"Í":u"i", u"Ó":u"o", u"Ú":u"u",
    u"à":u"a", u"è":u"e", u"ì":u"i", u"ò":u"o", u"ù":u"u",
    u"À":u"a", u"È":u"e", u"Ì":u"i", u"Ò":u"o", u"Ù":u"u",
    u"ñ":u"n", u"Ñ":u"n"}

ord_map={}

for sc in special_characters:
	ord_map[ord(sc)]=special_characters[sc]


# taken from 
# http://stackoverflow.com/questions/2922532/obtain-latitude-and-longitude-from-a-geotiff-file
def getCorners(tiffFile):
	# get the existing coordinate system
	ds = gdal.Open(tiffFile)
	old_cs= osr.SpatialReference()
	old_cs.ImportFromWkt(ds.GetProjectionRef())

	# create the new coordinate system
	wgs84_wkt = """
	GEOGCS["WGS 84",
	    DATUM["WGS_1984",
	        SPHEROID["WGS 84",6378137,298.257223563,
	            AUTHORITY["EPSG","7030"]],
	        AUTHORITY["EPSG","6326"]],
	    PRIMEM["Greenwich",0,
	        AUTHORITY["EPSG","8901"]],
	    UNIT["degree",0.01745329251994328,
	        AUTHORITY["EPSG","9122"]],
	    AUTHORITY["EPSG","4326"]]"""
	new_cs = osr.SpatialReference()
	new_cs .ImportFromWkt(wgs84_wkt)

	# create a transform object to convert between coordinate systems
	transform = osr.CoordinateTransformation(old_cs,new_cs) 

	#get the point to transform, pixel (0,0) in this case
	width = ds.RasterXSize
	height = ds.RasterYSize
	gt = ds.GetGeoTransform()
	minx = gt[0]
	miny = gt[3] + width*gt[4] + height*gt[5]
	maxx = gt[0] + width*gt[1] + height*gt[2]
	maxy = gt[3] 
	#get the coordinates in lat long
	lowerleft_latlng = transform.TransformPoint(minx,miny) 
	upperright_latlng = transform.TransformPoint(maxx,maxy) 
	print lowerleft_latlng
	print upperright_latlng
	return (lowerleft_latlng,upperright_latlng)
	

def normalizeFileName(file):
	name=file.lower()
	name=name.replace('a\xcc\x81','a').replace('e\xcc\x81','e').replace('i\xcc\x81','i').replace('u\xcc\x81','u').replace('o\xcc\x81','o')
	name=name.replace('\xc3\xa1','a')
	name=name.replace('\xc3\xa9','e')
	name=name.replace('\xc3\xad','i')
	name=name.replace('\xc3\xb3','o')
	name=name.replace('\xc3\xba','u')
	name=name.replace('\xcc\x83','n')

	name=name.replace('\xc3\xa0','a')
	name=name.replace('\xc3\xa8','e')
	name=name.replace('\xc3\xac','i')
	name=name.replace('\xc3\xb3','o')
	name=name.replace('\xc3\xb2','u')
	name=name.replace('\xc3\xb1','n')
	

	name=name.replace(' ','_')

	return name

def isRelevantFile(file):
	filenames=["urbArea_t2","urbArea_t0","urbArea_t1","urbFootprint_t0","urbFootprint_t1","urbFootprint_t1","New_Development_t0_t1","New_Development_t1_t2"]
	if file[0:-4] in filenames:
		return True

def getPeriodAndType(file,dir):
	
	if("shp" in file):
		return "zoning",""
	elif("urbArea" in file):
		type="urban_area"
		period=file.split('_')[1][0:2]
		#fix because client always use t0_t1
		if "T1T2" in dir:
			if period=="t0":
				period="t1"
			elif period=="t1":
				period="t2"
	elif("urbFootprint" in file):
		type="urban_footprint"
		period=file.split('_')[1][0:2]
		if "T1T2" in dir:
			if period=="t0":
				period="t1"
			elif period=="t1":
				period="t2"
		#print period
	else:
		type="new_development"
		period=file.split('_')[1]
		if "T0T1" in dir:
			period="t0_t1";
		if "T1T2"in dir:
			period="t1_t2"
	


	return type,period

def listCities(dir):

	
	#acceptedCitiesWithTiles=["buenos_aires/lomas_de_zamora","buenos_aires/san_fernando","buenos_aires/ezeiza"];
	acceptedCitiesWithTiles=["buenos_aires/avellaneda","buenos_aires/ensenada","buenos_aires/bahia_blanca/bahia","buenos_aires/la_matanza","buenos_aires/almirante_brown","buenos_aires/escobar","buenos_aires/merlo","buenos_aires/bahia_blanca/inge","buenos_aires/san_vicente","buenos_aires/moreno","buenos_aires/florencio_varela","catamarca/el_bannado","catamarca/san_fernando_del_valle_de_catamarca","catamarca/san_isidro","catamarca/santa_maria","catamarca/sumalao","cordoba/colonia_caroya","cordoba/cordoba","cordoba/dumesnil","cordoba/jesus_maria","cordoba/juarezcelman","cordoba/lacalera","cordoba/malvinas_arg","cordoba/mendiolaza","cordoba/rio_ceballos","cordoba/rio_cuarto/riocuarto","cordoba/salsipuedes","cordoba/unquillo","cordoba/villa_allende","chaco_-_resistencia/barranqueras","chaco_-_resistencia/fontana","chaco_-_resistencia/puerto_vilelas","chaco_-_resistencia/resistencia","chubut_-_rawson/accnorte","chubut_-_rawson/comodoro_rivadavia","chubut_-_rawson/gral_mosconi","chubut_-_rawson/rada_tilly","chubut_-_rawson/rawson_rawson","chubut_-_rawson/rawsontrelew","santa_fe/rosario/soldini","santa_fe/rosario/granbaigorria","santa_fe/santafe","santa_fe/rosario/rosario","santa_fe/rosario/fraybeltran","santa_fe/sjoserincon","santa_fe/recreo","santa_fe/rosario/alvear","santa_fe/villaadelina","santa_fe/rosario/capbermudez","santa_fe/rosario/funes","santa_fe/rosario/sanlorenzo","santa_fe/rosario/aldao","santa_fe/santotome","santa_fe/sauceviejo","santa_fe/rosario/perez","santa_fe/rosario/ptosanmartin","santa_fe/rosario/galvez","santa_fe/rosario/roldan","entre_rios_-_parana/parana_a","formosa/capital","jujuy/capital","la_pampa_-_santa_rosa/santarosa","la_rioja/capital","mendoza/mendoza_capital","misiones_-_posadas/posad","san_luis/san_luis","neuquen/cent","neuquen/neucapi","neuquen/plot","rio_negro_-_viedma/carmendepat","rio_negro_-_viedma/viedma","salta/all","salta/atoc","salta/cerr","salta/lacie","salta/lasc","salta/saltac","salta/vaq","salta/vlos","san_juan/chimbas","san_juan/pocito","san_juan/rawson","san_juan/rivadavia","san_juan/san_juan","san_juan/santa_lucia","stgo_del_estero/el_zanjon","stgo_del_estero/la_banda","stgo_del_estero/maco","stgo_del_estero/santiago","tucuman/banda_del_rio_sali","tucuman/barrio_san_felipe","tucuman/bsjose","tucuman/san_miguel_de_tucuman","tucuman/tafi_viejo","tucuman/va_m_moreno_colmenar","tucuman/villalf","tucuman/yerba","buenos_aires/bahia_blanca/grun","buenos_aires/marcos_paz","buenos_aires/hurlingham","buenos_aires/pilar","buenos_aires/lomas_de_zamora","buenos_aires/malvinas_argentinas","buenos_aires/berazategui","buenos_aires/tigre","buenos_aires/bahia_blanca/bahia_all","buenos_aires/moron","buenos_aires/mar_del_plata","buenos_aires/general_rodriguez","buenos_aires/san_fernando","buenos_aires/tres_de_febrero","buenos_aires/quilmes","buenos_aires/presidente_peron","buenos_aires/san_isidro","buenos_aires/bahia_blanca/villab","buenos_aires/bahia_blanca/vspor","buenos_aires/bahia_blanca/gr","buenos_aires/ituzaingo","buenos_aires/ezeiza","buenos_aires/la_plata","buenos_aires/beriso","buenos_aires/lanus","buenos_aires/general_san_martin","buenos_aires/jose_c_paz","buenos_aires/san_miguel","buenos_aires/vicente_lopez","buenos_aires/canuelas","buenos_aires/esteban_echeverria"]
    

	#acceptedCitiesWithTiles=["buenos_aires/berazategui","buenos_aires/general_rodriguez","buenos_aires/ezeiza","buenos_aires/la_plata","buenos_aires/beriso","buenos_aires/esteban_echeverria","buenos_aires/vicente_lopez"];

	#acceptedCitiesWithZoning = ["mendoza/godoycruz","buenos_aires/avellaneda","corrientes/corrientes_capital","jujuy/capital","buenos_aires/ensenada","santa_fe/santafe","chaco_-_resistencia/fontana","entre_rios_-_parana/oro_verde","buenos_aires/la_matanza","santa_fe/rosario/rosario","santa_fe/rosario/fraybeltran","buenos_aires/almirante_brown","buenos_aires/escobar","santa_fe/recreo","san_juan/rawson","chubut_-_rawson/rada_tilly","buenos_aires/merlo","buenos_aires/moreno","la_rioja/capital","chubut_-_rawson/comodoro_rivadavia","buenos_aires/florencio_varela","catamarca/san_fernando_del_valle_de_catamarca","chubut_-_rawson/rawsontrelew","buenos_aires/marcos_paz","buenos_aires/hurlingham","entre_rios_-_parana/parana_a","buenos_aires/pilar","mendoza/maipu","buenos_aires/lomas_de_zamora","la_pampa_-_santa_rosa/toay","buenos_aires/malvinas_argentinas","buenos_aires/berazategui","santa_fe/santotome","buenos_aires/moron","neuquen/plot","buenos_aires/general_rodriguez","buenos_aires/san_fernando","buenos_aires/tres_de_febrero","la_pampa_-_santa_rosa/santarosa","tucuman/yerba","cordoba/unquillo","buenos_aires/san_isidro","santa_fe/rosario/granbaigorria","chaco_-_resistencia/resistencia","santa_fe/sjoserincon","buenos_aires/ituzaingo","buenos_aires/quilmes","tucuman/san_miguel_de_tucuman","buenos_aires/ezeiza","buenos_aires/la_plata","salta/saltac","neuquen/neucapi","buenos_aires/beriso","buenos_aires/lanus","santa_fe/rosario/perez","santa_fe/rosario/ptosanmartin","buenos_aires/general_san_martin","mendoza/mendoza_capital","buenos_aires/jose_c_paz","santa_fe/rosario/galvez","buenos_aires/san_miguel","buenos_aires/vicente_lopez","buenos_aires/canuelas","chaco_-_resistencia/barranqueras","mendoza/guaymallen","buenos_aires/esteban_echeverria"]
	#acceptedCitiesWithZoning=["buenos_aires/moron","cordoba/unquillo","mendoza/guaymallen","buenos_aires/esteban_echeverria"]
	
	#acceptedCities = ["mendoza/godoycruz","buenos_aires/avellaneda","corrientes/corrientes_capital","santa_fe/santafe","santa_fe/rosario/rosario","buenos_aires/san_miguel","buenos_aires/vicente_lopez","buenos_aires/canuelas","mendoza/mendoza_capital","chubut_-_rawson/rawsontrelew","buenos_aires/ituzaingo","buenos_aires/quilmes"]

	arg1=5
	arg2=15

	for root, dirs, files in os.walk(dir):
		for file in files:
			try:
				if file[-3:]=="img":
					if isRelevantFile(file):
						#build paths
						fullPath=root+"/"+file;
						relativePath = root[len(dir):]

						#normalize filename ( substitute weird chars)
						relativePath=normalizeFileName(relativePath)

						if exec_restrict_files and relativePath not in acceptedCitiesWithTiles:
							continue
						else:
							print 'processing: ' + str(relativePath)
						
						

						#obtain type (urban_area/footpring,newdeve..) and period(t0,t1 or t2)
						path=file.split('/')
						type,period=getPeriodAndType(file,dir)

						#create dirs if necessary
						relativePathDir="gis/" + relativePath + "/" + type + "/"
						if not os.path.exists(relativePathDir):
							print 'not exists'
							os.makedirs(relativePathDir)

						#choose color table
						if(type=="urban_area"):
							color_table="gis/urban_area_color_table"
						elif type=="urban_footprint":
							color_table="gis/urban_footprint_color_table"
						elif type=="new_development":
							color_table="gis/new_development_color_table"

						outputTiff = "gis/" + relativePath + "/" + type + "/" + period + ".tiff"
						command = "gdaldem color-relief '" + fullPath + "' " + color_table + " " +  outputTiff +  " -alpha -b 1 -of GTiff"

						
						#track found files
						if relativePath not in foundFiles:
							foundFiles[relativePath]=[]

						foundFiles[relativePath]+=[(type,period,fullPath)]




						cmd2 = "gdal2tiles.py --resume -z " + str(arg1) + "-" + str(arg2)+ " -w none " + outputTiff + " public/tiles/" + relativePath + "/" + type + "/" + period

						# command = "gdaldem color-relief gis/sample/urban_footprint/t0.img gis/urban_footprint_color_table gis/sample/urban_footprint/t0.tiff -alpha -b 1 -of GTiff"
						# cmd2 = "gdal2tiles.py -z " + str(arg1) + "-" + str(arg2)+ " -w none gis/sample/urban_footprint/t0.tiff public/tiles/sample/urban_footprint/t0"
						commandwithparams=["gdaldem", "color-relief",fullPath,color_table,outputTiff,"-alpha","-b","1","-of","GTiff"]
						
						#commandwithparams=command.split(' ')
	 					commandDosWithParams = cmd2.split(' ')
	 					
	 					#print "command1"
	 					#print commandwithparams

	 					if exec_do_tiff:
							output1=call(commandwithparams)
							print output1
						#print "output:"
							

						#get corners
						if exec_get_corners:
							bbox=getCorners(outputTiff)
							if relativePath not in corners:
								corners[relativePath]=[]
						
							corners[relativePath]=[bbox]

						if exec_do_tiles:
							print commandDosWithParams
							output2=call(commandDosWithParams)
						
				elif file[-3:]=="shp":

						fullPath=root+"/"+file;
						relativePath=normalizeFileName(root[len(dir):])
						#print relativePath
						#qprint fullPath

						if exec_restrict_files and relativePath not in acceptedCitiesWithTiles:
							continue
						else:
							print 'processing: ' + str(relativePath)
						

						province=relativePath.split('/')[0] 
						city=relativePath.split('/')[1] 	

						print province
						print city

						
						path=file.split('/')
						type,period=getPeriodAndType(file,dir)

						
						
						outputDir = "public/zoning/" + relativePath;


						if not os.path.exists(outputDir):
							print 'dir ' + outputDir + " does not exist, creating.."
							os.makedirs(outputDir)




						if(relativePath not in foundFiles):
							sd=''
							#print relativePath
							#foundFiles[relativePath]=[]
						else:
							foundFiles[relativePath]+=[(type,period,fullPath)]


						outputFile = outputDir +  "/" + relativePath.split('/')[1] + ".json"


						#overwrite file if exists
						if os.path.exists(outputFile):
							os.remove(outputFile)

						zoning_cmd=["ogr2ogr","-f","GeoJSON",outputFile,fullPath]

						if exec_do_zoning:
							output=call(zoning_cmd)
							print output

				elif file=="resultados.txt":
					print 'resultados---'
					fullPath=root+"/"+file;
					relativePath=normalizeFileName(root[len(dir):])
					resultados=io.open(fullPath)
					print 'resultados---'
					print 'opened file'
					t0_edge=''
					t1_edge=''
					t0_open=''
					t1_open=''
					for line in resultados.readlines():
						if line.find('t0 EDGE INDEX is ')>=0:
							t0_edge=line[line.find('0.'):].replace('\n','')
						elif line.find('t1 EDGE INDEX is')>=0:
							t1_edge=line[line.find('0.'):].replace('\n','')
						elif line.find('t1 OPENNESS INDEX is')>=0:
							t1_open=line[line.find('0.'):].replace('\n','')
						elif line.find('t0 OPENNESS INDEX is')>=0:
							t0_open=line[line.find('0.'):].replace('\n','')

					if relativePath not in indexes:
						indexes[relativePath]={}

					print relativePath
					indexes[relativePath]['t0_edge']=t0_edge
					indexes[relativePath]['t1_edge']=t1_edge
					indexes[relativePath]['t0_open']=t0_open
					indexes[relativePath]['t1_open']=t1_open

			except:
				print "Unexpected error:", sys.exc_info()[0]
				print 'error processing file ' + str(file)
			
				

	



#Obj: run script on .img files and leave them somewhere useful
def main():
	displayName_dict=dict()
	city_names= io.open('city_names.csv')
	for line in city_names.readlines():
		displayName_dict[line.split(',')[0]]=line.split(',')[1].replace('"','').encode('utf-8')

	print displayName_dict;



	citiesWithIndex=0
	citiesWithoutIndex=[]

	for dir in ['atlas/T0T1/', 'atlas/T1T2/','atlas/Zonificacion/']:
		listCities(dir)

		missingCities={}
		completeCities = []
		compulsoryFiles=[("urban_area","t0"),("urban_area","t1"),("urban_area","t2"),("urban_footprint","t0"),("urban_footprint","t1"),("urban_footprint","t2"),("new_development","t0_t1"),("new_development","t1_t2")]
	for city in foundFiles:
		hasZoning=True
		complete=True
		foundTuples=[x[0:2] for x in foundFiles[city]]
		#check has all the tuples
		for file in compulsoryFiles:
			if file not in foundTuples:
				if ("zoning","") == file:
					print 'missing zoning info for city:' + str(city)
					#missingCities[city]=1
				complete=False
				#print "missing" + str(file) + " for city:" + str(city)
				if city not in missingCities:
					missingCities[city]=[]
				
				
				missingCities[city]+=[file]
		
		if ("zoning","") not in foundTuples:
			hasZoning=False

		if complete:
			
			
			try:
				displayName=",".join(city.split('/')[::-1])
				displayName=displayName_dict[city];
				if exec_get_corners:
					boundNE=str(corners[city][0][0][:-1][::-1]).replace('(','').replace(')','')
					boundSW=str(corners[city][0][1][:-1][::-1]).replace('(','').replace(')','')
					hasIndex=False;
					t0_edge=''
					t1_edge=''
					t0_open=''
					t1_open=''
					if city in indexes:
						hasIndex=True
						citiesWithIndex+=1
						t0_edge=indexes[city]['t0_edge']
						t1_edge=indexes[city]['t1_edge']
						t0_open=indexes[city]['t0_open']
						t1_open=indexes[city]['t1_open']
					else:
						citiesWithoutIndex+=[city]


					print 'city ' + str(city) + ' : ' + str(len(city.split('/')))
					completeCities+=[{'name':city.split('/')[1],'province':city.split('/')[0],'dirname':city,'boundSW':boundSW,'boundNE':boundNE,'displayName':displayName,'zoning':hasZoning,'t0_open':t0_open,'t1_open':t1_open,'t1_edge':t1_edge,'t0_edge':t0_edge,'hasIndex':hasIndex}]
				else:
					completeCities+=[{'name':city.split('/')[1],'province':city.split('/')[0],'dirname':city,'displayName':displayName,'zoning':hasZoning}]
			except:
				print "Unexpected error:", sys.exc_info()[0]
				print 'error adding comlete city ' + city

	
	
	print ' cities with no index'
	
	for cit in citiesWithoutIndex:
		print cit

	print ' end of  no index'

	print "complete cities " + str(len(completeCities))
	
	for city in completeCities:
		print city['dirname']	

	print "missing cities " + str(len(missingCities))
	for city in missingCities:
		print city + " " + str(missingCities[city])
	

	outputcsv = io.open('cities.csv','wb')
	writer = csv.writer(outputcsv, delimiter=',', quotechar='"', quoting=csv.QUOTE_ALL)
	writer.writerow(['id','name','province','dirname','boundsSW','boundsNE','displayName','zoning','t0_open','t1_open','t0_edge','t1_edge','hasIndex'])
	newId=1
	for city in completeCities:
		if exec_get_corners:
			cityRow = [ newId,city['name'],city['province'],city['dirname'],city['boundNE'],city['boundSW'],city['displayName'],city['zoning'],city['t0_open'],city['t1_open'],city['t0_edge'],city['t1_edge'],city['hasIndex']]
		else:
			cityRow = [ newId,city['name'],city['province'],city['dirname'],city['displayName'],city['zoning']]
		writer.writerow(cityRow)
		newId+=1






main()
