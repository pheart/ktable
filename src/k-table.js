(function(window, document) {
	if (!window.$ && !window.jQuery) return false;
    var Observe = utilHelper.Observe;
    var BindEventsHelper = utilHelper.BindEventsHelper;

    // simple error 
    var Error = {
        sendTypeError: function(message) {
            return new ReferenceError(message);
        },
        sendError: function(message) {
            return new Error(message);
        },
        sendReferenceError: function(message) {
            return new ReferenceError(message);
        }
    }

    /**
     * tableRow
     * @params {Object}
            - data {Object} the data of row
            - columnNameList {Object} each column's render result in row
            - rowClass: {String | Function} use the string or function's executive result as row's class
            - index: {Number} the index of this row     
     * @params {Object} Table's instance 
     */
    var TableRow = function(options, parentTable) {
        this.parent = parentTable;
        this.initialize(options);
    }

    TableRow.prototype.initialize = function(options) {
        $.extend(this, options);
        this.El = $('<tr></tr>');
        this.render(this.data);
        this.hasSetEvents = false;
        this.initState();
    }

    // initialize state
    // use state for being variable. when state is change, render the ui that relative to state
    TableRow.prototype.initState = function() {
        this.state = {
            select: false
        }
    }

    // render ui.
    TableRow.prototype.render = function(data) {
        var columnNameList = this.columnNameList,
            _this = this,
            data = data || _this.data,
            content = '',
            El;
        $.each(columnNameList, function(i, name) {
            if (name == 'index') {
                var currentPage = _this.parent.currentPage,
                    perNums = _this.parent.options.perNums;
                if (!currentPage || !perNums) {
                    var index = _this.index + 1;
                } else {
                    var index = (currentPage-1)*perNums + _this.index + 1;
                }
                content += _this.createColItem(index);
            } else if ($.type(name) == 'string') {
                content += _this.createColItem(data[name]);
            } else if ($.type(name) == 'function') {
                content += _this.createColItem(name.call(null, data));
            } else if ($.type(name) == 'object') {
                content += _this.createColItem(data[name.name], name['className']);
            }
        });
        this.setData(data);
        this.El.html(content);
        this.setClass();
    }

    // render the ui that relative to state
    TableRow.prototype.renderState = function() {
        var checkboxSelect = this.El.find('input.rowSelect');
        if (this.state.select) {
            checkboxSelect.attr('checked', true);
        } else {
            checkboxSelect.attr('checked', false);
        }
    }

    // get td's element
    TableRow.prototype.createColItem = function(value, className) {
        var classname = className ? 'class=' + className : ''; 
        return '<td ' + classname + '>' + value + '</td>';
    }

    // delagate events to El
    TableRow.prototype.setEvents = function(events, eventHandleObj) {
        if (events && !this.hasSetEvents) {
            if ($.isEmptyObject(events) || $.isEmptyObject(eventHandleObj)) return;
            BindEventsHelper.setEvents(events, eventHandleObj, this.El, null, this);
            this.hasSetEvents = true;
        }
    }

    // set El's class by this.rowClass
    TableRow.prototype.setClass = function() {
        var rowClass = this.rowClass,
            type = $.type(rowClass),
            index = this.index,
            className;

        if (type == 'string') {
            className = rowClass;
        } else if (type == 'function') {
            className = rowClass.call(this, index);
        }

        this.El.removeClass().addClass(className);
    }

    TableRow.prototype.setState = function(flag) {
        this.state = {
            select: flag
        };
        this.renderState();
    }

    // set index 
    TableRow.prototype.setIndex = function(index) {
        this.index = index;
    }

    TableRow.prototype.setData = function(data) {
        if ($.type(data) != 'object') 
            return Error.sendTypeError('data format is not correct');
        this.data = $.extend(this.data, data);
    }

    // destroy the row
    TableRow.prototype._destroy = function() {
        // remove dom
        this.El.remove();
        // undelegate events
        BindEventsHelper.undelegate(this.El);
        //this.trigger('destroy');
    }

    TableRow.prototype.destroy = function() {
        this.parent.destroyRow(this);
    }

    // refresh the row by data
    TableRow.prototype.refresh = function(data) {
        this.render(data);
    }

    utilHelper.Observe.make(TableRow.prototype);

    /**
     * Table
     * @params {Object}
     * depend on util jQuery
     */ 
    Table = function(options) {
        var defaultOptions = {
            El: '',
            paginate: true, //default is true
            paginateBtns: ['上一页', '下一页'],
            events: {}, // events
            eventsHandler: {}, // events handlers
            skin: '',
            rowClass: function(index) {
                if (index%2 == 0) {
                    return 'odd';
                } else {
                    return 'even';
                }
            }
        }
        this.options = $.extend(defaultOptions, options);
        this.initStatus();
        this.initialize(options);
    };

    Table.prototype.initialize = function(options) {
        var el,
            eltype,
            El,
            result,
            _this = this;
        this.rowsList = [];

        function getKey(index) {
            if (!_this.options.columnNameList) return '';
            var name = _this.options.columnNameList[index],
                nameType = $.type(name);
            if(nameType == 'object') {
                name = name.text;
                nameType = $.type(name);
            } 
            if (nameType != 'Number' && nameType != 'string' ) return '';
            return name;
        }

        function setOrderByEvent(target, locX) {
            // delegate events to orderby element
            var options = _this.options;
            target.on('click', 'i', function(e) {
                var type;
                if (e.target.className == 'order-as') {
                    type = 'asc';
                } else if (e.target.className == 'order-des') {
                    type = 'desc';
                }
                var name = getKey(locX);
                _this.statusOptions.orderBy = {
                    key: name,
                    type: type
                };
                if (options.source && $.type(options.source) == 'function') {
                    _this.toggleLoad();
                    options.source.call(_this, {currentPage: 1}, function(opt) {
                        _this.status = 'orderBy';
                        _this.switchPage(1, opt.totalPage, opt.datas, true);
                        _this.toggleLoad();
                    }, _this.statusOptions);
                }
                if (options.source && $.type(options.source) == 'array') {
                    var name = getKey(locX);
                    if (type == 'asc') {
                        _this.orderByAsc(name);
                    } else if (type == 'desc') {
                        _this.orderByDesc(name);
                    }
                    _this.switchPage();
                }
            })
        }

        if ((el = this.options.el)) {
            eltype = $.type(el);
            if (el instanceof jQuery) {  
                // el is instance of jQuery 
                El = el;
            } else if (eltype == 'string') {
                if (/#\w/.test(el) || /\.\w/.test(el)) {
                    if(!(El = $(el)).length) return Error.sendReferenceError('the dom object is not exist');
                } else {
                    // default is id.
                    if(!(El = $('#' + el)).length) return Error.sendReferenceError('the dom object is not exist,please give id');
                }
            } else if(eltype == 'function') {
                // Dynamic afferent the el
                result = el.call(null);
                if (result && result instanceof jQuery) {
                    El = result;
                } else if (result && $.type(result) == 'string') {
                    El = $(result);
                } else {
                    return new Error.sendTypeError('when el is function, the format of return result is wrong ');
                }
            }
            var ths = El.find('table thead th');
            if (ths.length) {
                $.each(ths, function(index) {
                    var th = ths.eq(index), orderByTarget;
                    orderByTarget = th.find('.order-c');
                    if (orderByTarget.length) {
                        setOrderByEvent(orderByTarget, index);
                    }
                })
            }
            this.El = El;
            this.El.addClass('k-table-container');
        } else if (this.options.ThList.length) {
            this.El = $('<div class="k-table-container"></div>');
            var tableEl = $('<table>' +
                        '<thead>' +
                            '<tr></tr>' +
                        '</thead>' +
                        '<tbody></tbody>' +
                     '</table>'),
            container = tableEl.find('thead tr');
            this.El.append(tableEl);
            $.each(this.options.ThList, function(i, n){
                if ($.type(n) == 'string') {
                    container.append($('<th>' + n + '</th>'));
                } else if($.type(n) == 'object') {
                    if (n.isOrderBy == true) {
                        var content = $('<th>' + n.text + '</th>');
                        var orderByTarget = $('<div class="order-c"><i class="order-as" title="升序"></i><i class="order-des" title="降序"></i></div>');
                        content.append(orderByTarget);
                        container.append(content);
                        setOrderByEvent(orderByTarget, i);
                    }
                }
            })
        }

        this.initState();
        this.initMultiSelect();
        this.setSkin();
        this.render();
    }

    // initalize statusOptions
    Table.prototype.initStatus = function() {
        // this object used to be the third parms of options.source when options.source is function
        // we can deal with different situations in options.source by it
        this.statusOptions = {
            // when  call refresh method of Table's instance when 
            refresh: {},
            // key  the orderby column's name
            // type  asc | desc  
            orderBy: {}
        };        
    }

    Table.prototype.initState = function() {
        this.state = {
            selectAll: false
        }
    }

    Table.prototype.setState = function(o) {
        this.state = $.extend(this.state, o);
        this.renderState();
    }

    Table.prototype.initMultiSelect = function() {
        var _this = this;
        if (this.options.multiselect) {
            this.options.columnNameList.unshift(function(data, state) {
                return '<input class="rowSelect" type="checkbox"  />';
            });
            this.options.events['input.rowSelect click'] = 'rowSelect';
            this.options.eventsHandler.rowSelect = function(e, row) {
                row.setState(!row.state.select);
            }
            var selectAllTarget = this.El.find('thead #selectAll');
            selectAllTarget.click(function() {
                var allSelect = false;
                $.each(_this.rowsList, function(i, row) {
                    if (row.state.select) {
                        allSelect = true;
                    } else {
                        allSelect = false;
                        return false;
                    }
                })
                if (allSelect) {
                    _this.unselectAll();
                    _this.setState({selectAll: false});
                } else {
                    _this.selectAll();
                    _this.setState({selectAll: true});
                }
            })
        }
    }

    Table.prototype.clearStatus = Table.prototype.initStatus;

    Table.prototype.render = function() {
        var source = this.options.source,
            _this = this,
            options = _this.options,
            type = $.type(source);
        if (type == 'array' && source.length) {
            this.currentPage = 1;
            if (options.perNums && options.paginate) {
                var totalPage = this.countPageNums(),
                    currentPage = this.currentPage;
                if (!_this.paginate && options.paginate) {
                    _this.createPaginate({totalPage: totalPage, currentPage: currentPage});
                }
            }
            this._render(this.getCurPageData(this.currentPage, source));
        } else if(type == 'function') {
            _this.toggleLoad();
            source.call(this, {currentPage: 1}, function(opt) {
                if (options.paginate && !_this.paginate) {
                    _this.createPaginate({totalPage: opt.totalPage, currentPage: _this.currentPage});
                }
                _this.switchPage(_this.currentPage, opt.totalPage, opt.datas, true);
                _this.toggleLoad();
            }, _this.statusOptions);
        }
    }

    /**
     * render one page
     * @parms {Array} render datas.
     */
    Table.prototype._render = function(datas) {
        var _this = this,
            rowsList = _this.rowsList,
            rowsListLength = rowsList.length,
            datasLength;

        if ($.type(datas) != 'array') throw new Error.sendTypeError('the type of data must be array');

        datasLength = datas.length;

        if (rowsListLength > datasLength) {
            for (var i=datasLength, l=rowsListLength-1; l >= i; l--) {
                _this.deleteRow(rowsList[l]);
            }
        }
        
        $.each(datas, function(i, rowData){
            if (rowsList[i] instanceof TableRow) {
                rowsList[i].setState(false);
                rowsList[i].refresh(rowData);
            } else {
                var tableRow = _this.createRow(i, rowData);
                tableRow.on('destroy', function() {
                    _this.destroyRow(tableRow);
                })
                rowsList.push(tableRow);
                _this.El.find('tbody').append(tableRow.El);
            }
        })

        this.setEvents();
        this.setClass();
    }

    Table.prototype.renderState = function(flag) {
        var selectAllTarget = this.El.find('thead #selectAll');
        if (this.state.selectAll) {
            selectAllTarget.attr('checked', true);
        } else {
            selectAllTarget.attr('checked', false);
        }
    }

    // instance pagination to be Table's pagination
    Table.prototype.createPaginate = function(settings) {
        if (!Paginate) return;
        var paginateBtns = this.options.paginateBtns;
        $.extend(settings, {btns: paginateBtns});
        var paginate = new Paginate(settings),
            _this = this,
            container = $('<div class="paginate-con"></div>');
        this.paginate = paginate;
        container.html(paginate.El);
        this.El.append(container);
        paginate.on('switch', function(o, next){
            _this._switchPage(o.currentPage, 1, _this.statusOptions);
        });

        paginate.on('errorSwitch', function(o){
            _this.trigger('errorSwitch', o);
        }); 
    }

    // set skin by add class for El
    Table.prototype.setSkin = function() {
        if (!this.options.skin) return;
        this.El.addClass(this.options.skin);
    }

    Table.prototype.getCurPageData = function(currentPage, datas, isFn /* options.source type */) {
        var perNums = this.options.perNums;
        if (isFn) return datas.slice(0, perNums);
        return datas.slice((currentPage-1)*perNums,
                 currentPage*perNums > datas.length ? datas.length : currentPage*perNums);        
    }

    Table.prototype._switchPage = function(currentPage, loadType, way) {
        var loadType = loadType || 1,
            _this = this,
            source = _this.options.source;
        if (source && $.type(source) == 'function') {
            if (loadType == 1) {
                _this.toggleLoad();
            } else if (loadType == 2) {
                _this.bottomToggleLoad();
            }
            source.call(_this, {currentPage: currentPage}, function(opt) {
                _this.switchPage(currentPage, opt.totalPage, opt.datas, true);
                if (loadType == 1) {
                    _this.toggleLoad();
                } else if (loadType == 2) {
                    _this.bottomToggleLoad();
                }
            }, way);
        }
        if (source && $.type(source) == 'array') {
            _this.switchPage(currentPage);
        }
    }

    // switch page 
    Table.prototype.switchPage = function(currentPage, totalPage, datas, isFn) {
        var currentPage = currentPage || 1,
            totalPage = totalPage || this.countPageNums(),
            datas = datas || this.options.source,
            perNums = this.options.perNums;
        if (currentPage > totalPage) {
            currentPage = totalPage;
        }
        this.refreshCurrentPageTable(this.getCurPageData(currentPage, datas, isFn), currentPage);
        this.paginate && this.refreshPaginate(currentPage, totalPage);
        this.setState({selectAll: false});
    }

    /**
     * refresh currentpage's table
     * @params {Array} the datas that currentpage's table need
     * @params {Number} currentpage
     */ 
    Table.prototype.refreshCurrentPageTable = function(datas, currentPage) {
        this.currentPage = currentPage;
        this.refreshWhichPage(datas);
    }

    /**
     * refresh pagination
     * @params {Number} the currentpage of pagination
     * @params {Number} the totalpage of pagination
     */ 
    Table.prototype.refreshPaginate = function(currentPage, totalPage) {
        this.paginate.options.currentPage = currentPage;
        this.paginate.options.totalPage = totalPage;
        this.paginate._resetPagination();
    }

    Table.prototype.refreshWhichPage = function(datas) {
        var self = this,
            rowsList;

        if (datas) {
            self._render(datas);
        }

        rowsList = this.rowsList;
        $.each(rowsList, function(index, row){
            if (row.index != index) {
                row.setIndex(index);
                row.setState(false);
                row.refresh();
            }
        })
    }

    // create row object
    Table.prototype.createRow = function(index, rowdata) {
        var _this = this,
            columnNameList = _this.options.columnNameList,
            rowClass = _this.options.rowClass;

        return new TableRow({
                data: rowdata,
                columnNameList: columnNameList,
                rowClass: rowClass,
                index: index
            }, _this);
    }
    
    // delegate events 
    Table.prototype.setEvents = function() {
        var _this = this,
            rowsList = _this.rowsList,
            events = _this.options.events,
            eventsHandler = _this.options.eventsHandler;
        if ($.isEmptyObject(events) || $.isEmptyObject(eventsHandler)) 
            return;
        if (rowsList.length) {
            $.each(rowsList, function(index, row){
                row.setEvents(events, eventsHandler);
            })
        }
    }

    // set each row's class
    Table.prototype.setClass = function() {
        var _this = this,
            rowsList = _this.rowsList;
        if (rowsList.length) {
            $.each(rowsList, function(index, row){
                row.setClass();
            })
        }
    }

    // destroy row
    Table.prototype.destroyRow = function(row) {
        var rowsList = this.rowsList,
            options = this.options;
            currentPage = this.currentPage || 1;
        this.deleteRow(row);
        if (options.source && $.type(options.source) == 'array') {
            options.source.splice(row.index ,1);
        }
        this._switchPage(currentPage, 2, this.statusOptions);
    } 

    // delete row
    Table.prototype.deleteRow = function(row) {
        var rowsList = this.rowsList, 
            _this = this,
            options = this.options;
            currentPage = this.currentPage || 1;
        row._destroy();
        rowsList.splice(row.index, 1);
    }    

    // destroy table
    Table.prototype.destroy = function() {
        var _this = this;
        this.El && this.El.remove();
        var rowsList = this.options.rowsList;
        $.each(rowsList, function(index, row){
            _this.destroyRow(row);
        }); 
    }

    /**
     * refresh table
     * @params {Array | Object}  
     */
    Table.prototype.refresh = function(opts) {
        var opts = opts || {}, 
            type = $.type(opts),
            originalSourceType = $.type(this.options.source);
        if (type == 'array') {
            // the opts's type is Array, use opts to be optins.source, refresh the table's firstpage
            this.options.source = opts;
            this.switchPage(1, this.countPageNums());            
        } else if (originalSourceType == 'function' && type == 'object') {
            // set statusOptions.refresh
            this.statusOptions.refresh = opts;
            this.render();
        }
    }

    Table.prototype.selectAll = function() {
        $.each(this.rowsList, function(index, row) {
            row.setState(true);
        })
    }

    Table.prototype.unselectAll = function() {
        $.each(this.rowsList, function(index, row) {
            row.setState(false);
        })
    }

    // count the totalpages
    Table.prototype.countPageNums = function() {
        // config paginate false, default return 1
        if (!this.options.paginate)
            return 1;
        var source = this.options.source;
        if (source && $.type(source) == 'array') {
            return Math.ceil(this.options.source.length / this.options.perNums);
        } else if (source && $.type(source) == 'function') {
            return this.paginate.options.totalPage || 1;
        }
    }

    // when switch page 
    // if sync access data or large amount of time to calculating data, show load dialog
    Table.prototype.toggleLoad = function() {
        if (!this.loadEl) {
            this.loadEl = $('<div class="k-load-div"><span class="k-load-wrap"></span></div>');
        }
        if (!this.loadStatus) {
            this.loadStatus = true;
            this.El.append(this.loadEl).show();
            this.El.find('table tbody').hide();
            this.El.find('.paginate').hide();
        } else {
            this.loadStatus = false;
            this.loadEl.remove();
            this.El.find('table tbody').show();
            this.El.find('.paginate').show();
        }
    }

    // delete row, if sync access data, show the load dialog
    Table.prototype.bottomToggleLoad = function() {
        if (!this.loadBotEl) {
            this.loadBotEl = $('<div class="k-loadbot-div"><span class="k-load-wrap"></span></div>');
        }
        if (!this.loadBotStatus) {
            this.loadBotStatus = true;
            this.El.find('table').after(this.loadBotEl);
        } else {
            this.loadBotStatus = false;
            this.loadBotEl.remove();
        }
    }

    // Descending  order 
    // only used for options.source is Array
    Table.prototype.orderByDesc = function(name) {
        var datas = this.options.source;
        if (datas.length) {
            for (var i=0, l=datas.length; i<l; i++) {
                for (var j=i+1, n=datas.length; j<n; j++) {
                    if (datas[i][name] < datas[j][name]) {
                        var cur = datas.splice(j, 1);
                        datas.splice(i, 0, cur[0]);
                    }
                }   
            }
        }
    }

    // Ascending  order 
    // only used for options.source is Array
    Table.prototype.orderByAsc = function(name) {
        var datas = this.options.source;
        if (datas.length) {
            for (var i=0, l=datas.length; i<l; i++) {
                var cp = datas[i];
                for (var j=i+1, n=datas.length; j<n; j++) {
                    if (cp[name] > datas[j][name]) {
                        var cur = datas.splice(j, 1);
                        datas.splice(i, 0, cur[0]);
                    }
                }   
            }
        }
    }

    // make table to be Subscriber
    Observe.make(Table.prototype);    

    window.Table = Table;

})(window, document)