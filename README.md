# Fixed-Stop-Route-Builder
###### Note: To run this package, you must supply your own google maps API key in RST/index.html & RSC/index.html

### RST Builder
The _RST_ (Route Segment Template) Builder is used to combine _stations_ and manual way-points to create a segment.
Stations consist of a station name, and verified geo-location.
RST's consist of stations/waypoint, minimum & maximum layovers, and drive times.

The route emap can be dragged to create way-points to fine-tune a route segment. 

![rst builder](/media/rst_builder_example.png) 

### RSC Builder
The _RSC_ (Route Segment Configuration) Builder is used to combine RST's and assign a "configuration" to them.
Configurations consist of start & end time, layover, headway, applied days, and bus display settings.
One or more RSC's are conbined to form a _route_.

A stop-by-stop table can be generated in which stops can be manually modified, excluded, or assigned to different blocks.

![rsc builder](/media/rsc_builder_example.png)
