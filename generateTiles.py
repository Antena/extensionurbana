import gdal
from subprocess import call
from subprocess import Popen
import os
from os import *
from os.path import *

def isRelevantFile(file):
	filenames=["urbArea_t2","urbArea_t0","urbArea_t1","urbFootprint_t0","urbFootprint_t1","urbFootprint_t1","New_Development_t0_t1","New_Development_t1_t2"]
	if file[0:-4] in filenames:
		return True

def getPeriodAndType(file):
	if("urbArea" in file):
		type="urban_area"
		period=file.split('_')[1]
	elif("urbFootprint" in file):
		type="urban_footprint"
		period=file.split('_')[1]
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
					print relativePath
					print fullPath
					path=file.split('/')
					period,type=getPeriodAndType(file)
					print period
					print type
					outputTiff = "gis/" + relativePath + "/" + type + "/" + period + ".tiff"
					command = "gdaldem color-relief " + fullPath + " gis/urban_footprint_color_table " +  outputTiff +  " -alpha -b 1 -of GTiff"
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
					print output2

				

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
