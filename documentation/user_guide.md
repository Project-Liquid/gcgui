# gcgui

here is a short tutorial on how to use the GUI.

This app is an Electron app which serves as a wrapper for a React Native application. this guide is split into two parts: user guide, and developer guide

**NOTE THAT THE APPS NAME MAY STILL BE CALLED PITWALL WHEN INSTALLED.** sorry, i'm working on a fix for that. 

---
# user guide
this part will help users quickly install and run the application. it should also go into some details on the apps features
## quickstart
### install 
#### method 1: prebuilt binary
1. go to releases
2. click on the relevant file for your OS (.exe for windows, etc)
3. install and run app
#### method 2: run from source (requires npm)
1. download source files
2. install nodejs and npm
3. use "npm run dev"

### usage (PLIQ users)
1. select CSV mode at the top. This is pretty important otherwise the numbers will be wrong and the graphs will not work.

2. select baud rate (top right corner). Almost all the code is written in 9600 baud, so select that option. When in doubt, refer to the source code; in the "setup" loop, there will be a line that will tell you what that number is:
```c++ 
void setup (){
	Serial.begin(9600); // this line will tell you that the serial is in 9600 baud
	Serial.begin(115200); // if it is in 115200 baud
	
	// if there is no Serial.begin line, there is no information being written to serial!!! the app cannot be used. 
}
```
3. close any apps that read from serial! this is super important!!! You must close the *Arduino IDE serial monitor,* and in some cases, **the arduino IDE itself**. We will go over using both at the same time in the developer's guide.
4.  hit refresh next to the ports dropdown, then select your board's port from the dropdown. It will probably be the only option that appears. 
> A note to Linux users: usually, your TTY will appear as well, listed as "/dev/tty0" or similar. Ignore that; your board is not a TTY. It's usually a ACM0 or USB0. see linux section in debugging in faqs.
5. set up your widgets. This is how you can actually view information. You can edit by clicking layout editor in the top right. 

	a. you may choose to load a template setup. click "load layout" (scroll down on the left) and a file explorer should appear. If you are running from source, these are located in path/to/project/src/assets/examples/pliq_template1.json and ...examples/pliq_template2.json. Otherwise, go to the project github page, and download from these links: 
	https://github.com/Project-Liquid/gcgui/blob/main/src/assets/examples/pliq_template1.json
	and
	https://github.com/Project-Liquid/gcgui/blob/main/src/assets/examples/pliq_template2.json
	
	b. you can edit the layout further by clicking on the widget, THEN dragging the widget to the desired spot. do not attempt click AND drag. I'm working on that. 

	c. you can adjust widget sizes by clicking AND dragging on the little light blue square. you can adjust widget positions by clicking AND dragging on the top of the widget. 

	d. to edit any widget settings, right click the widget, then select edit. Similarly, to delete any widgets, right click on the widget, then select delete.
	
	e. each widget comes with unique settings and functions. see the widgets section to read more

6. the numbers should begin displaying, and the graphs should be graphing. if this is not the case, see **debugging and faqs**. 
7. to begin a recording, simply press record. to clear the graphs, you can press clear all, but that is simply a visual effect and does not wipe the recordings. 
8. to end a recording, click stop recording
9. recordings are automatically saved in ~/Documents/gcgui-recordings


### playback and analysis

to play back a recording as if it was happening in the present, simply switch from "live" mode to "replay log" mode. Note that this will cause the app to stop recording, and cease communication with any USB devices!

1. press select file at the top
2. hit play. 

one more little feature is the "full history" button. You can see its full capabilities in the **graphs widget** section, but it differs in that it shows the recording's entire graphical history. 


## widgets and their functions 

### number
shows a number for a given datapoint (csv and crtd)
### line plot 
shows a line plot for a given datapoint over time (csv and crtd)
#### options
- fit 
	- shows a (linear) line of best fit, its equation, and its approximate r value
- multi
	- shows a checkbox with all the datapoints, where you can select multiple and have each line displayed at the same time
- names
	- shows a dropdown where you can edit the textbox of each datapoint's name (so column 1's values can be named "upstream" or etc.) note that the sizing is still fucky! you will need to scroll down inside the widget to actually edit the values. 
### raw serial
shows raw serial input over time (csv and crtd)
#### options
- lock
    - locks the screen to the bottom. hit unlock to scroll freely.
### can interpreter (CAN)
shows a bunch of data parsed from CAN. Separates messages by id and performs adjustments to match to a given unit of measurement
### radio (currently CAN, plans to implement for csv as well)
a dedicated interpreter to show only radio status (ie status and signal strength)
### send 
a serial terminal that is able to write to serial (output through serial)
### key send
like send, but hits enter after each keypress (keymapping capabilities). IT MUST BE TOGGLED ON TO WORK for security purposes
### key button
basically, its a button that can send a message whenever it is pressed. 
#### options
- toggle
	- when checked, it will behave like a toggle instead of a button (useful for opening/closing valves, etc). 
- send message
	- on button press, it will send that key value; if it is set to "j", it will send "j" on serial every time the button is pressed. 

## debugging and faq
- the app isn't showing data! :(
	- go through this checklist in order:
		- is the arduino ide serial monitor closed? try closing the IDE entirely.
			- you may need to restart the gcgui app if it is STILL unable to connect. see below
		- is the usb cable connected? 
		- did you select the right port?
		- did you select the right baud?
		- did you select CSV mode? 
		- are you in live mode, not replay mode?
- the app is working, but widgets say disconnected/widgets say disconnected no matter what
	- yea sometimes for some reason it happens, not sure why. sometimes you gotta refresh and let her cook for a bit longer.
- my usb port/board isn't showing up! 
	- kill the arduino ide. If you're on linux, try using sudo pkill if it's really stubborn. 
	- hit refresh
	- if it still isnt working, try selecting the dropdown option "-- Select a port --", and then refreshing
	- quit the app and try above steps again.
	- if that STILL doesnt work, something is probably wrong with the OS or system not the app. 
	- if you're confident that its none of these things, email me because I've never seen that happen on not linux (see linux section) and I'd love to hear from you. 
- key button press widget is disconnected but nothing else is 
	- if all else fails, you can manually send messages
	- sometimes, after using the other sending widgets a couple times, it comes around and connects randomly. Not sure why, I'm actually unable to reproduce this bug but it happens frequently. 

- I can't edit the widgets/the widgets keep editing whenever I click something!
	- go to layout editor
	- select lock/unlock widget configuration
- everything is working except for the graphs / the graph or number widget dropdowns all have weird names? what is ERPM??
	- change to csv mode at the very top. 
- I'm on linux!
	- why? 
	- make sure you are in the proper groups:
		```bash
		sudo usermod -aG dialout $USER
		```
		then logout and log back in.
	- close the arduino ide serial monitor 
- how do i upload code from the ide OR how do i read from serial through the IDE while the app is open?
	- good question!
	- if you go to the port select dropdown, and hit "-- Select a port --" as the option (at the top), the app will disconnect from the port, leaving the ide able to use the port as before.
	- go back to the IDE and select the board's port
	- if it still doesn't show up, you should quit the gcgui app. 