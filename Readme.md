ktable
=======

ktable is a JavaScript libiary for build dynamic table with paging function.

#Examples

    var data = [
        {name: 'lyc', old: 4, sex: '男4', birth: 2014},
        {name: 'pheart', old: 5, sex: '女5', birth: 2015},
        {name: 'zhangsan', old: 6, sex: '男6', birth: 2016}
    ];

    var table = new Table({
        el: 'simpleTable',
        columnNameList: [
            'name',
            'sex', 
            function(data) {
                return data.old * 2 - 1;
            },
            function(data) {
                var button = '<a href="javascript:;" id="edit">edit</a>' + 
                    '<a href="javascript:;" id="delete">delete</a>';
                return button;
            }
        ],
        source: data,
        events: {
            'click #edit': 'edit',
            'click #delete': 'delete'
        },
        eventsHandler: {
            edit: function(e, row) {
                row.set({name: 'liubei'});
                row.render();
            },
            delete: function(e, row) {
                row.set({name: 'new'});
                //row.destory();
                row.refresh();
            }
        }
    });

# 

    var table = new Table({
        thList: []
        columnNameList: [
            'name',
            'sex', 
            function(data) {
                return data.old * 2 - 1;
            },
            function(data) {
                var button = '<a href="javascript:;" id="edit">edit</a><a href="javascript:;" id="delete">delete</a>';
                return button;
            }
        ],
        source: function(o, next, opt) { 
            var currentPage = o.currentPage;
            // suppose wait is time consuming operation 
            wait(function() {
                next({datas: resp.datas, totalPage: resp.totalPages});
            });
        },
        events: {
            'click #edit': 'edit',
            'click #delete': 'delete'
        },

        eventsHandler: {
            edit: function(e, row) {
                row.set({name: 'liubei'});
                row.render();
            },
            delete: function(e, row) {
                row.set({name: 'new'});
                //row.destory();
                row.refresh();
            }
        }
    });

    $('#test').html(table.El);




# The options

* el: [Optional]  the container
    if el is empty, ktable will create container
    if el is passed, parameter types can be
        -string  '#one'   '.one'  'one' (equal to '#one')
        -jQuery object $('#one')
        -function the return value are used as el

* ThList [Optional]  ['name', 'old', {text: 'sex', isOrderBy: [true | false]}]
    if el is not passed, the Thlist must be passed.  that used for create table's thead
    the parameter types of thlist's child item can be 
        -string 'name' used for th's text
        -object 
            -text    th's text
            -isOrderBy  if the column can sort

* columnNameList [Array]  table's each row display data
    parameter types can be
        -string the key in row data
        -function the return value used as display data

* skin add class to the container

* rowClass dynamic set the each row's class
    -string
    -function    the function parm is the index of row

* paginate if show the pagination  default is true

* paginateBtns [a, b]  the innerHtml of pagination's previous btn and next btn
        we sometimes use that to change previous btn and next btn's style

* perNums   the nums of each page

* multiselect 

* source
    -array  [{}, {}]
    -function  we can do with dynamic data 
    the function have three params. (o, pagTable, option)
        the o {currentPage: }  we can get the current page that will jump 
        the pagTable    pagTable({datas: '', totalPage: ''})  pass params and  excute the function  will render the table and pagination
        the option special object  we can know if it is sort or refresh by the options.

* events  the events in each row
    {
        'click #aa': 'getNums'
    }
* eventsHandler 
    {
        'getNums': function(e, row){ }
    }
    -e the event source 
    -row  the object of each row 
        row.data  get the row's data
        row.setData({}) update the row's data
        row.refresh()  refresh the row

