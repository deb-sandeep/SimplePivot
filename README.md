# SimplePivot
###### Very thin pivoting library in JavaScript

Given a tabular data, this library gives an extremely simple interface to derive and display multiple pivot tables from it.

```js
<script>
function test() {

  // Define the column names by which we will refer to the pivot groupings
  var srcColNames = [ "Date", "Subject", "Lesson", "Time" ] ;
  
  // The underlying data of the pivot representation
  var pivotData = [
     [ "10-26", "History",   "Mughals", 300 ],
     [ "10-26", "History",   "Islam",   200 ],
     [ "10-27", "Geography", "Climate", 150 ],
     [ "10-27", "History",   "Islam",   250 ]
  ] ;
  
  // Initialize the pivot table by setting the column names and corresponding 
  // data set
  var pivotTable = new PivotTable() ;
  pivotTable.setPivotData( srcColNames, pivotData ) ;

  // Initialize the pivot table by providing
  // - The row groupings (in this case, group by Subject, then by Lesson
  // - The column group
  // - The value which needs to be aggregated
  pivotTable.initializePivotTable( [ "Subject", "Lesson" ], "Date", "Time" ) ;
  
  // Render the pivot table on an existing div
  pivotTable.renderPivotTable( "pivot_table_div", "Time spent per subject" ) ;
}
</script>

```
![Screenshot](/ext/screenshot.png?raw=true)

### Rationale of YAL (Yet Another Library)
With more functional pivoting libraries already available, what was the itch to make a less functional one?

- Needed an extremely simple (no frills, drag drop etc etc.) pivoting library
- It was a worthy problem

### Features which are not evident in the above example
- Custom render helper can be injected (see the big_pivot.html)
- Default rendering can be done in both collapsed and expanded mode

### Limitations (in this version)
- Column grouping not support (planned in near future)
- Needs at least one column group
  - This restriction will be removed in (very) near future

### NOTE
If you are interested in forking and want to get a kick start on the design - drop me a note and I will be happy to explain the gory details.
