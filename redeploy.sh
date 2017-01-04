#!/bin/bash
git -C /home/pi/kanabot pull
forever stopall
forever cleanlogs
/home/pi/kanabot/start.sh

