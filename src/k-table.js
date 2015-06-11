(function(window, document) {
	if (!window.$ && !window.jQuery) return false;
    var Observe = utilHelper.Observe;
    var BindEventsHelper = utilHelper.BindEventsHelper;

    var TableRow = function(options, parentTable) {
        this.parent = parentTable;
        this.initialize(options);
    }

    TableRow.prototype = {
        constructor: TableRow,
        initialize: function(options) {
            $.extend(this, options);
            this.El = $('<tr></tr>');
            this.render(this.data);
            this.hasSetEvents = false;
            this.status = true;
        },
        render: function(data) {
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
                    content += _this.createColItem(data[name.name], name['class']);
                }
            });
            this.setData(data);
            this.El.html(content);
            this.setClass();
        },
        createColItem: function(value, className) {
            var classname = className ? 'class=' + className : ''; 
            return '<td ' + classname + '>' + value + '</td>';
        },
        setEvents: function(events, eventHandleObj) {
            if (events && !this.hasSetEvents) {
                if ($.isEmptyObject(events) || $.isEmptyObject(eventHandleObj)) return;
                BindEventsHelper.setEvents(events, eventHandleObj, this.El, null, this);
                this.hasSetEvents = true;
            }
        },
        setClass: function() {
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
        },
        set: function(dataObj) {
            var _this = this;
            $.each(dataObj, function(name, val){
                _this.data[name] = val;
            })
        },
        setIndex: function(index) {
            this.index = index;
        },
        setData: function(data) {
            this.data = data;
        },
        // default set top.
        setLoc: function(index) {
            var index = index || 0;
            this.parent && this.parent.setWhichRow(this, index);
        },
        destroy: function() {
            this.El.remove();
            BindEventsHelper.undelegate(this.El);
            this.parent && this.parent.destroyRow(this);
        },
        refresh: function(data) {
            this.render(data);
        }
    }

    Error = {
        sendTypeError: function(message) {
            return new ReferenceError(message);
        },
        sendError: function(message) {
            return new Error(message);
        },
        sendReferenceError: function() {
            return new ReferenceError(message);
        }
    }

    /**
     * Table
     * @params {Object}
     * depend on util jQuery
     */ 
    Table = function(options) {
        var defaultOptions = {
            El: '',
            paginate: true, //默认有翻页
            paginateBtns: ['上一页', '下一页'],
            events: {}, // 定义事件
            eventsHandler: {}, // 事件执行句柄
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
        this.statusOptions = {type: 'normal'};
        this.initialize(options);
    };

    Table.prototype.initialize = function(options) {
        var el,
            eltype,
            El,
            result;
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
            var options = _this.options;
            target.on('click', 'i', function(e) {
                var type;
                if (e.target.className == 'order-as') {
                    type = 'asc';
                } else if (e.target.className == 'order-des') {
                    type = 'desc';
                }
                var name = getKey(locX);
                _this.statusOptions = {
                    type: 'orderBy',
                    key: name
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
                // default is id.
                if(!(El = $('#' + el)).length) return Error.sendReferenceError('该dom对象不存在,请传入id');
            } else if(eltype == 'function') {
                // Dynamic afferent the el
                result = el.call(null);
                if (result && result instanceof jQuery) {
                    El = result;
                } else if (result && $.type(result) == 'string') {
                    El = $(result);
                } else {
                    return new Error.sendTypeError('方法el返回的格式不正确');
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
        this.setSkin();
        this.render();
    }

    Table.prototype.render = function() {
        var source = this.options.source,
            _this = this,
            options = _this.options,
            type = $.type(source);
        if (type == 'array' && source.length) {
            this.currentPage = 1;
            if (options.perNums && options.paginate) {
                var totalPage = Math.ceil(source.length/options.perNums),
                    currentPage = this.currentPage;
                _this.createPaginate({totalPage: totalPage, currentPage: currentPage});
            }
            this._render(this.getCurPageData(this.currentPage, source));
        } else if(type == 'function') {
            _this.toggleLoad();
            source.call(this, {currentPage: 1}, function(opt) {
                if (options.paginate) {
                    _this.createPaginate({totalPage: opt.totalPage, currentPage: _this.currentPage});
                }
                _this.switchPage(_this.currentPage, opt.totalPage, opt.datas, true);
                _this.toggleLoad();
            }, _this.statusOptions);
        }
    }

    // 显示某一页的表格数据
    Table.prototype._render = function(datas) {
        var _this = this,
            rowsList = _this.rowsList,
            rowsListLength = rowsList.length,
            datasLength;
        this.datas = datas;

        if ($.type(datas) != 'array') throw new Error.sendTypeError('数据类型必须为数组');

        datasLength = datas.length;

        if (rowsListLength > datasLength) {
            for (var i=datasLength, l=rowsListLength-1; l >= i; l--) {
                rowsList[l].status = false;
                rowsList[l].El.hide();
            }
        }
        
        $.each(datas, function(i, rowData){
            if (rowsList[i] instanceof TableRow) {
                rowsList[i].refresh(rowData);
                if (!rowsList[i].status) {
                    rowsList[i].El.show();
                }
            } else {
                var tableRow = _this.createRow(i, rowData);
                rowsList.push(tableRow);
                _this.El.find('tbody').append(tableRow.El);
            }
        })

        this.setEvents();
        this.setClass();
    }

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

    Table.prototype.setSkin = function() {
        if (!this.options.skin) return;
        this.El.addClass(this.options.skin);
    }

    Table.prototype.getCurPageData = function(currentPage, datas, isFn /* source获取数据方式 */) {
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

    Table.prototype.switchPage = function(currentPage, totalPage, datas, isFn) {
        var currentPage = currentPage || 1,
            totalPage = totalPage || Math.ceil(this.options.source.length / this.options.perNums),
            datas = datas || this.options.source,
            perNums = this.options.perNums;
        if (currentPage > totalPage) {
            currentPage = totalPage;
        }
        this.refreshCurrentPageTable(this.getCurPageData(currentPage, datas, isFn), currentPage);
        this.refreshPaginate(currentPage, totalPage);
    }

    Table.prototype.refreshCurrentPageTable = function(datas, currentPage) {
        this.currentPage = currentPage;
        this.refreshWhichPage(datas);
    }

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
                row.refresh();
            }
        })
    }

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

    Table.prototype.setClass = function() {
        var _this = this,
            rowsList = _this.rowsList;
        if (rowsList.length) {
            $.each(rowsList, function(index, row){
                row.setClass();
            })
        }
    }

    Table.prototype.destroyRow = function(row) {
        var rowsList = this.rowsList, 
            _this = this,
            options = this.options;
            currentPage = this.currentPage || 1;
        rowsList.splice(row.index, 1);
        if (options.source && $.type(options.source) == 'array') {
            options.source.splice(row.index ,1);
        }
        _this._switchPage(currentPage, 2, _this.statusOptions);
    }

    Table.prototype.destroy = function() {
        var _this = this;
        this.El && this.El.remove();
        var rowsList = this.options.rowsList;
        $.each(rowsList, function(index, row){
            row.destroy();
        }); 
    }

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

    Observe.make(Table.prototype);    

    window.Table = Table;

})(window, document)