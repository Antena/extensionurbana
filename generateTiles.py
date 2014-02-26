 # coding=UTF-8
import gdal
from subprocess import call
from subprocess import Popen
import os
from os import *
from os.path import *

locations={}

special_characters={
    u"á":u"a", u"é":u"e", u"í":u"i", u"ó":u"o", u"ú":u"u",
    u"Á":u"a", u"É":u"e", u"Í":u"i", u"Ó":u"o", u"Ú":u"u",
    u"à":u"a", u"è":u"e", u"ì":u"i", u"ò":u"o", u"ù":u"u",
    u"À":u"a", u"È":u"e", u"Ì":u"i", u"Ò":u"o", u"Ù":u"u",
    u"ñ":u"n", u"Ñ":u"n"}

ord_map={}

for sc in special_characters:
	ord_map[ord(sc)]=special_characters[sc]


def normalizeFileName(file):
	print file.lower()

	name=file.lower()
	name=name.replace('a\xcc\x81','a').replace('e\xcc\x81','e').replace('i\xcc\x81','i').replace('u\xcc\x81','u').replace('o\xcc\x81','o')
	name=name.replace('\xc3\xa1','a')
	name=name.replace('\xc3\xa9','e')
	name=name.replace('\xc3\xad','i')
	name=name.replace('\xc3\xb3','o')
	name=name.replace('\xc3\xba','u')

	name=name.replace('\xc3\xa0','a')
	name=name.replace('\xc3\xa8','e')
	name=name.replace('\xc3\xac','i')
	name=name.replace('\xc3\xb3','o')
	name=name.replace('\xc3\xb2','u')

	name=name.replace(' ','_')

	print name
	return name

def isRelevantFile(file):
	filenames=["urbArea_t2","urbArea_t0","urbArea_t1","urbFootprint_t0","urbFootprint_t1","urbFootprint_t1","New_Development_t0_t1","New_Development_t1_t2"]
	if file[0:-4] in filenames:
		return True

def getPeriodAndType(file):
	if("urbArea" in file):
		type="urban_area"
		period=file.split('_')[1][0:2]
	elif("urbFootprint" in file):
		type="urban_footprint"
		period=file.split('_')[1][0:2]
	else:
		type="new_development"
		period=file.split('_')[1]
		if(period=="t0"):
			period="t0_t1"
		else:
			period="t1_t2"


	return type,period

def listCities(dir):
	arg1=2
	arg2=4
	for root, dirs, files in os.walk(dir):
		for file in files:
			if file[-3:]=="img":
				if isRelevantFile(file):
					fullPath=root+"/"+file;
					relativePath = root[len(dir):]

					#normalize filename
					relativePath=normalizeFileName(relativePath)
					
					path=file.split('/')
					type,period=getPeriodAndType(file)
					
					outputTiff = "gis/" + relativePath + "/" + type + "/" + period + ".tiff"
					command = "gdaldem color-relief '" + fullPath + "' gis/urban_footprint_color_table " +  outputTiff +  " -alpha -b 1 -of GTiff"
					cmd2 = "gdal2tiles.py -z " + str(arg1) + "-" + str(arg2)+ " -w none " + outputTiff + " public/tiles/" + relativePath + "/" + type + "/" + period

					# command = "gdaldem color-relief gis/sample/urban_footprint/t0.img gis/urban_footprint_color_table gis/sample/urban_footprint/t0.tiff -alpha -b 1 -of GTiff"
					# cmd2 = "gdal2tiles.py -z " + str(arg1) + "-" + str(arg2)+ " -w none gis/sample/urban_footprint/t0.tiff public/tiles/sample/urban_footprint/t0"
					commandwithparams=command.split(' ')
 					commandDosWithParams = cmd2.split(' ')
 					print commandwithparams
 					print commandDosWithParams
					#output1=call(commandwithparams)
					#print output1
					#output2=call(commandDosWithParams)
					#print output2

				

	# dirs=[]
	# files=[]
	# entries=os.listdir(dir)
	# for var in entries:
	# 	if(os.path.isdir(dir + str(var))):
	# 		dirs+=[dir + str(var)]
	# 	elif os.path.isfile(dir + str(var)):
	# 		files+=[dir + str(var)]
    #
	# print dirs
	



#Obj: run script on .img files and leave them somewhere useful
def main():
	for dir in ['atlas/T0T1/', 'atlas/T1T2/', 'atlas/zoning/']:
		listCities(dir)
	# arg1=2
	# arg2=5
	# command = "gdaldem color-relief gis/sample/urban_footprint/t0.img gis/urban_footprint_color_table gis/sample/urban_footprint/t0.tiff -alpha -b 1 -of GTiff"
	# cmd2 = "gdal2tiles.py -z " + str(arg1) + "-" + str(arg2)+ " -w none gis/sample/urban_footprint/t0.tiff public/tiles/sample/urban_footprint/t0"
	# commandwithparams=command.split(' ')
 	# commandDosWithParams = cmd2.split(' ')
    #
 	# print commandwithparams
 	# print commandDosWithParams
    #
	# output1=call(commandwithparams)
	# output2=call(commandDosWithParams)
	# print output1
	# print output2



main()
