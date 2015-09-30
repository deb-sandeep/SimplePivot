// -----------------------------------------------------------------------------
// This file contains the logic of building a pivot table from the data 
// provided. Usage of this library is as per the following example:
//
// <html>
//  <head>
//      <link rel="stylesheet" type="text/css" 
//            href="/res/style/jquery.treetable.css">
//      <link rel="stylesheet" type="text/css" 
//            href="/res/style/jquery.treetable.theme.css">
//      <script src="/res/scripts/jquery-2.1.1.min.js"></script>
//      <script src="/res/scripts/jquery.treetable.js"></script>
//      <script src="/res/scripts/pivot.js"></script>
//      
//      <script>
//      function test() {
//          var srcColNames = [ "Date", "Subject", "Lesson", "Time" ] ;
//          var pivotData = [
//              [ "10-26", "History", "Mughals", 300 ],
//              [ "10-26", "History", "Islam", 200 ],
//              [ "10-27", "Geography", "Climate", 150 ],
//              [ "10-27", "History", "Islam", 250 ]
//          ] ;
//
//          var pivotTable = new PivotTable() ;
//          pivotTable.setPivotData( srcColNames, pivotData ) ;
//          pivotTable.initializePivotTable( [ "Subject", "Lesson" ], "Date", "Time" ) ;
//          pivotTable.renderPivotTable( "pivot_table_div", "Time spent per subject" ) ;
//      }
//      </script>
//  </head>
//  <body onload="test()">
//      <div id="pivot_table_div"></div>
//  </body>
// </html>
//
// -----------------------------------------------------------------------------

// -----------------------------------------------------------------------------
// Class PivotDSNode
// -----------------------------------------------------------------------------
PivotDSNode.prototype.NODE_TYPE_ROW     = 1 ;
PivotDSNode.prototype.NODE_TYPE_COL_REF = 2 ;
PivotDSNode.prototype.NODE_TYPE_VAL     = 3 ;

function PivotDSNode( nodeType, value ) {

    this.nodeType = nodeType ;
    this.value    = value ;
    
    this.parent   = null ;
    this.children = [] ;

    this.depth    = 0 ;
    this.rowNum   = -1 ;
    this.colNum   = -1 ;

    this.isRootNode = function() {
        return ( this.parent == null ) ;
    }

    this.isLeafNode = function() {
        return ( this.children.length == 0 ) ;
    }

    this.isColumnRefNode = function() {
        return ( this.nodeType == this.NODE_TYPE_COL_REF ) ;
    }

    this.isValueNode = function() {
        return ( this.nodeType == this.NODE_TYPE_VAL ) ;
    }

    this.isTerminalRow = function() {
        var isTerminalRow = false ;
        if( !this.isLeafNode() ) {
            if( this.children[0].nodeType == this.NODE_TYPE_COL_REF ) {
                return true ;
            }
        }
        return false ;
    }

    this.isGroupRowNode = function() {
        if( this.nodeType == this.NODE_TYPE_ROW ) {
            if( !this.isTerminalRow() ) {
                return true ;
            }
        } 
        return false ;
    }

    this.isRowNode = function() {
        return( this.nodeType == this.NODE_TYPE_ROW ) ;
    }

    this.getChildrenCount = function() {
        return this.children.length ;
    } 

    this.addChild = function( node ) {
        node.parent = this ;
        node.depth = this.depth + 1 ;
        this.children.push( node ) ;
    }

    this.createAndGetNewChild = function( nodeType, value ) {
        var child = new PivotDSNode( nodeType, value ) ;
        this.addChild( child ) ;
        return child ;
    }

    this.findChild = function( value ) {
        for( var i=0; i<this.children.length; i++ ) {
            if( this.children[i].value === value ) {
                return this.children[i] ;
            }
        }
    }

    this.assignRowAndColumnNumbers = function( nextRowNum, colNames ) {
        
        if( this.isRowNode() ) {

            this.rowNum = nextRowNum ;
            nextRowNum++ ;

            if( this.isTerminalRow() ) {
                for( var i=0; i<this.children.length; i++ ) {
                    this.assignColumnNumber( this.children[i], 
                                             colNames, 
                                             this.rowNum ) ;
                }
            }
            else {
                for( var i=0; i<this.children.length; i++ ) {
                    nextRowNum = this.children[i].assignRowAndColumnNumbers( 
                                                        nextRowNum, colNames ) ;
                }
            }
        }
        return nextRowNum ;
    }

    this.assignColumnNumber = function( colRefNode, colNames, rowNum ) {

        colRefNode.rowNum = rowNum ;
        colRefNode.colNum = 1 + colNames.indexOf( colRefNode.value ) ;

        for( var i=0; i<colRefNode.children.length; i++ ) {
            var valNode = colRefNode.children[i] ;
            valNode.rowNum = rowNum ;
            valNode.colNum = colRefNode.colNum ;
        }
    }

    this.populateDataIntoGrid = function( grid, parentRowIds ) {

        if( this.isRowNode() ) {

            if( !this.isRootNode() ) {
                parentRowIds[this.rowNum] = this.parent.rowNum ;
            }
            grid[this.rowNum][0] = this.value ;
        }
        else if( this.isColumnRefNode() ) {

            var cellValue = 0 ;
            for( var i=0; i<this.children.length; i++ ) {
                cellValue += this.children[i].value ;
            }
            grid[this.rowNum][this.colNum] = cellValue ;
        }

        for( var i=0; i<this.children.length; i++ ) {
            this.children[i].populateDataIntoGrid( grid, parentRowIds ) ;
        }

        if( this.isRowNode() ) {
            this.populateGroupRowAndColumnTotalData( grid ) ;
        }
    }

    this.populateGroupRowAndColumnTotalData = function( grid ) {

        var gridRow = grid[this.rowNum] ;
        var numCol  = gridRow.length ;

        var groupRowTotal = 0 ;
        for( var colIndex=1; colIndex<numCol-1; colIndex++ ) {

            if( this.isGroupRowNode() ) {
                var groupColVal = 0 ;
                for( var childIndex=0; childIndex<this.children.length; childIndex++ ) {
                    var childRow = this.children[childIndex].rowNum ;
                    var cellData = grid[childRow][colIndex] ;

                    if( cellData != null ) {
                        groupColVal += cellData ;
                    }
                }

                if( groupColVal != 0 ) {
                    grid[this.rowNum][colIndex] = groupColVal ;
                    groupRowTotal += groupColVal ;
                }
            }
            else {
                var cellData = grid[this.rowNum][colIndex] ;
                if( cellData != null ) {
                    groupRowTotal += cellData ;
                }
            }
        }

        if( groupRowTotal != 0 ) {
            grid[this.rowNum][numCol-1] = groupRowTotal ;
        }
    }

    this.toString = function( indent ) {

        var output = indent + this.rowNum + ":" + this.value + " [" + this.nodeType + "]" ;
        for( var i=0; i<this.children.length; i++ ) {
            output += "\n" + this.children[i].toString( indent + "    " ) ;
        }
        return output ;
    }
}

// -----------------------------------------------------------------------------
// Class PivotTree
// -----------------------------------------------------------------------------
function PivotTree( rowDimAttrs, colDimAttr, valAttr ) {

    this.root        = new PivotDSNode( PivotDSNode.prototype.NODE_TYPE_ROW, "" ) ;
    this.rowDimAttrs = rowDimAttrs ; // Array
    this.colDimAttr  = colDimAttr ;
    this.valAttr     = valAttr ;

    this.numRows  = 2 ; // Column names and the grand total row
    this.numCols  = 2 ; // Row names and the grand total
    this.colNames = [] ;

    this.sourceDataColumnNames = null ;
    this.rowDimAttrIndexes = [] ;
    this.colDimAttrIndex   = -1 ;
    this.valAttrIndex      = -1 ;

    this.setSourceDataColumnNames = function( sourceDataColumnNames ) {

        this.sourceDataColumnNames = sourceDataColumnNames ;

        for( var i=0; i<this.rowDimAttrs.length; i++ ) {
            this.rowDimAttrIndexes[i] = 
              findAttrIndex( this.rowDimAttrs[i], sourceDataColumnNames ) ;
        }

        this.colDimAttrIndex = findAttrIndex( this.colDimAttr, sourceDataColumnNames ) ;
        this.valAttrIndex    = findAttrIndex( this.valAttr, sourceDataColumnNames ) ;
    }

    var findAttrIndex = function( attrName, colNames ) {
        var index = colNames.indexOf( attrName ) ;
        if( index == -1 ) {
            throw "Row dimension attribute " + attrName + 
                  " not found in source columns." ;
        }
        return index ;
    }

    this.addRecordToTree = function( record ) {
        var branchData = this.extractBranchData( record ) ;
        this.insertBranchDataIntoTree( branchData ) ;
    }

    this.extractBranchData = function( record ) {
        
        var branchData = {} ;

        var rowData = [] ;
        for( var i = 0; i < this.rowDimAttrIndexes.length; i++ ) {
            rowData.push( record[ this.rowDimAttrIndexes[i] ] ) ;
        } 

        branchData[ 'rowData' ] = rowData ;
        branchData[ 'colData' ] = record[ this.colDimAttrIndex ] ;
        branchData[ 'value'   ] = record[ this.valAttrIndex ] ; 

        return branchData ;
    }

    this.insertBranchDataIntoTree = function( branchData ) {

        var rowData = branchData.rowData ;
        var node    = this.root ;
        var existingNode = null ;

        for( var i=0; i<this.rowDimAttrs.length; i++ ) {
            existingNode = node.findChild( rowData[i] ) ;
            if( existingNode == null ) {
                node = node.createAndGetNewChild( node.NODE_TYPE_ROW, rowData[i] )  ;
                this.numRows++ ;
            }
            else {
                node = existingNode ;
            }
        }

        // Now we add the column reference rows
        existingNode = node.findChild( branchData.colData ) ;
        if( existingNode == null ) {
            node = node.createAndGetNewChild( node.NODE_TYPE_COL_REF, branchData.colData ) ;
        }
        else {
            node = existingNode ;
        }

        // Now add the value. Note that one col ref can have multiple values.. 
        // this is where we can use aggregate functions
        node = node.createAndGetNewChild( node.NODE_TYPE_VAL, branchData.value ) ;
        
        if( this.colNames.indexOf( branchData.colData ) == -1 ) {
            this.colNames.push( branchData.colData ) ;
            this.colNames.sort() ;
            this.numCols += 1 ; 
        }
    }

    this.assignRowAndColumnNumbers = function() {
        this.root.assignRowAndColumnNumbers( 1, this.colNames ) ;
    }

    this.populateDataIntoGrid = function( grid, parentRowIds ) {
        this.root.populateDataIntoGrid( grid, parentRowIds ) ;
        for( var i=0; i<this.colNames.length; i++ ) {
            grid[0][i+1] = this.colNames[i] ;
        }
        grid[0][this.numCols-1] = "Row Total" ;
        grid[1][0] = "Column Total" ;
    }
}

// -----------------------------------------------------------------------------
// Class PivotTable
// -----------------------------------------------------------------------------
function PivotTable() {

    this.colNames     = null ;
    this.pivotData    = null ;
    this.pivotTree    = null ;
    this.dataGrid     = null ;
    this.parentRowIds = null ;

    this.pivotTableId = null ;

    this.setPivotData = function( colNames, pivotData ) {

        this.colNames = colNames ;
        this.pivotData = pivotData ;
    }

    this.initializePivotTable = function( rowDimensions, colDimension, valueAttribute ) {

        this.pivotTree = new PivotTree( rowDimensions, colDimension, valueAttribute ) ;
        this.pivotTree.setSourceDataColumnNames( this.colNames ) ;

        for( var rowIndex=0; rowIndex<this.pivotData.length; rowIndex++ ) {
            this.pivotTree.addRecordToTree( this.pivotData[rowIndex] ) ;
        }

        this.pivotTree.assignRowAndColumnNumbers() ;
        this.initializeGrid() ;
        this.pivotTree.populateDataIntoGrid( this.dataGrid, this.parentRowIds ) ;
    }

    this.initializeGrid = function() {

        this.dataGrid = [] ;
        this.parentRowIds = [] ;

        for( var rowIndex=0; rowIndex<this.pivotTree.numRows; rowIndex++ ) {
            var rowArray = [] ;
            for( var colIndex=0; colIndex<this.pivotTree.numCols; colIndex++ ) {
                rowArray.push( null ) ;
            }
            this.dataGrid.push( rowArray ) ;
            this.parentRowIds.push( -1 ) ;
        }
    }

    this.renderPivotTable = function( divName, caption, renderHelperCallback, expandAll ) {

        caption = typeof caption !== 'undefined' ? caption : "" ;
        renderHelperCallback = typeof renderHelperCallback !== 'undefined' ? renderHelperCallback : null ;

        var tableId = divName + "_table" ;
        var renderString = "<table border='1' id='" + tableId + "'>" ;
        renderString += "<caption>" + caption + "</caption>" ;
        renderString += getPivotTableHeaderRenderString( this.dataGrid, renderHelperCallback ) ;
        renderString += getPivotTableBodyRenderString( this.dataGrid, this.parentRowIds, renderHelperCallback ) ;
        renderString += "</table>" ;

        document.getElementById( divName ).innerHTML = renderString ;
        $( "#" + tableId ).treetable( { expandable: true } ) ;

        if( expandAll ) {
            $( "#" + tableId ).treetable( "expandAll" ) ;
        }

        this.pivotTableId = tableId ;
    }

    this.expandFirstRow = function() {
        if( this.dataGrid.length > 2 ) {
            $( "#" + this.pivotTableId ).treetable( "expandNode", "2" ) ;
            var nodes = $( "#" + this.pivotTableId ).find( "[data-tt-parent-id='2']" ) ;
            for( var i=0; i<nodes.length; i++ ) {
                var node = nodes[i] ;
                $( "#" + this.pivotTableId ).treetable( "expandNode", 
                               nodes[i].attributes[ "data-tt-id" ].nodeValue ) ;
            }
        }
    }

    var getPivotTableHeaderRenderString = function( grid, renderHelperCallback ) {

        var renderString = "<thead>" ;
        renderString += getPivotTableHeaderRowRenderString( 0, grid, "<th>", "</th>", renderHelperCallback ) ;
        renderString += getPivotTableHeaderRowRenderString( 1, grid, "<td>", "</td>", renderHelperCallback ) ;
        renderString += "</thead>" ;
        return renderString ;
    }

    var getPivotTableHeaderRowRenderString = function( rowIndex, grid, startTag, endTag, renderHelperCallback ) {
        
        var gridRow = grid[rowIndex] ;
        var renderString = "<tr>" ;
        for( var colIndex=0; colIndex<gridRow.length; colIndex++ ) {

            var cellData = gridRow[ colIndex ] ;
            if( renderHelperCallback != null ) {
                cellData = renderHelperCallback( rowIndex, colIndex, cellData ) ;
            }
            else {
                if( cellData == null ) { cellData = "" ; } 
            }
            renderString += startTag + cellData + endTag ;
        }
        renderString += "</tr>" ;
        return renderString ;
    }

    var getPivotTableBodyRenderString = function( grid, parentRowIds, renderHelperCallback ) {

        var renderString = "<tbody>" ;
        for( var rowIndex=2; rowIndex<grid.length; rowIndex++ ) {
            renderString += getPivotTableBodyRowRenderString( 
                                                    rowIndex,
                                                    grid, 
                                                    rowIndex, 
                                                    parentRowIds[rowIndex],
                                                    renderHelperCallback ) ;
        }
        renderString += "</tbody>" ;
        return renderString ;
    }

    var getPivotTableBodyRowRenderString = function( rowIndex, grid, rowNum, parentRowNum, renderHelperCallback ) {

        var gridRow = grid[rowIndex] ;
        var attrList = "data-tt-id='" + rowNum + "'" ;
        if( parentRowNum != 1 ) {
            attrList += " data-tt-parent-id='" + parentRowNum + "'" ;
        }

        var renderString = "<tr " + attrList + ">" ;
        for( var colIndex=0; colIndex<gridRow.length; colIndex++ ) {

            var cellData = gridRow[ colIndex ] ;
            if( renderHelperCallback != null ) {
                cellData = renderHelperCallback( rowIndex, colIndex, cellData ) ;
            }
            else {
                if( cellData == null ) { cellData = "" ; } 
            }
            
            renderString += "<td>" + cellData + "</td>" ;
        }
        renderString += "</tr>" ;
        return renderString ;
    }
}