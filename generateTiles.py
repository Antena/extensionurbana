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


locations={}

foundFiles = {}
corners = {}

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
		print period
	else:
		type="new_development"
		period=file.split('_')[1]
		if "T0T1" in dir:
			period="t0_t1";
		if "T1T2"in dir:
			period="t1_t2"
	


	return type,period

def listCities(dir):
	arg1=5
	arg2=15
	for root, dirs, files in os.walk(dir):
		for file in files:
			if file[-3:]=="img":
				if isRelevantFile(file):
					#build paths
					fullPath=root+"/"+file;
					relativePath = root[len(dir):]

					#normalize filename ( substitute weird chars)
					relativePath=normalizeFileName(relativePath)
					
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




					cmd2 = "gdal2tiles.py -z " + str(arg1) + "-" + str(arg2)+ " -w none " + outputTiff + " public/tiles/" + relativePath + "/" + type + "/" + period

					# command = "gdaldem color-relief gis/sample/urban_footprint/t0.img gis/urban_footprint_color_table gis/sample/urban_footprint/t0.tiff -alpha -b 1 -of GTiff"
					# cmd2 = "gdal2tiles.py -z " + str(arg1) + "-" + str(arg2)+ " -w none gis/sample/urban_footprint/t0.tiff public/tiles/sample/urban_footprint/t0"
					commandwithparams=["gdaldem", "color-relief",fullPath,color_table,outputTiff,"-alpha","-b","1","-of","GTiff"]
					
					#commandwithparams=command.split(' ')
 					commandDosWithParams = cmd2.split(' ')
 					
 					print "command1"
 					print commandwithparams

					output1=call(commandwithparams)
					print "output:"
					print output1

					#get corners
					bbox=getCorners(outputTiff)
					if relativePath not in corners:
						corners[relativePath]=[]
					
					corners[relativePath]=[bbox]

					print commandDosWithParams
					output2=call(commandDosWithParams)
					print output2
			elif file[-3:]=="shp":

					fullPath=root+"/"+file;
					relativePath=normalizeFileName(root[len(dir):])

					province=relativePath.split('/')[0] 
					city=relativePath.split('/')[1] 

					
					path=file.split('/')
					type,period=getPeriodAndType(file,dir)

					outputDir = "public/zoning/" + province;

					if not os.path.exists(outputDir):
						print 'dir ' + outputDir + " does not exist, creating.."
						os.makedirs(outputDir)



					if(relativePath not in foundFiles):
						foundFiles[relativePath]=[]

					foundFiles[relativePath]+=[(type,period,fullPath)]


					outputFile = outputDir +  "/" + relativePath.split('/')[1] + ".json"

					#overwrite file if exists
					if os.path.exists(outputFile):
						os.remove(outputFile)

					zoning_cmd=["ogr2ogr","-f","GeoJSON",outputFile,fullPath]

					output=call(zoning_cmd)
					print output

				

	



#Obj: run script on .img files and leave them somewhere useful
def main():
	for dir in ['atlas/T0T1/', 'atlas/T1T2/', 'atlas/zoning/']:
		listCities(dir)

		completeCities = []
		compulsoryFiles=[("zoning",""),("urban_area","t0"),("urban_area","t1"),("urban_area","t2"),("urban_footprint","t0"),("urban_footprint","t1"),("urban_footprint","t2"),("new_development","t0_t1"),("new_development","t1_t2")]
	for city in foundFiles:
		complete=True
		foundTuples=[x[0:2] for x in foundFiles[city]]
		#check has all the tuples
		for file in compulsoryFiles:
			if file not in foundTuples:
				complete=False
				print "missing" + str(file) + " for city:" + str(city)
		if complete:
			
			boundNE=str(corners[city][0][0][:-1][::-1]).replace('(','').replace(')','')
			boundSW=str(corners[city][0][1][:-1][::-1]).replace('(','').replace(')','')
			completeCities+=[{'name':city.split('/')[1],'province':city.split('/')[0],'dirname':city,'boundSW':boundSW,'boundNE':boundNE}]

	print "complete cities"
	
	outputcsv = io.open('cities.csv','wb')
	writer = csv.writer(outputcsv, delimiter=',', quotechar='"', quoting=csv.QUOTE_ALL)
	writer.writerow(['id','name','province','dirname','boundsSW','boundsNE'])
	newId=1
	for city in completeCities:
		cityRow = [ newId,city['name'],city['province'],city['dirname'],city['boundNE'],city['boundSW']]
		writer.writerow(cityRow)
		newId+=1






main()
