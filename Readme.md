ktable 是一个动态构建表格的javascript库
## 

### options

|name|Type|Required|Description|
|:---|:---|:---|:---|
|el|[optional]|false|表格容器|
|  |String ||作为id,从document中获取表格容器|
|  |Jquery El||使用Jquery获取到表格容器|
|  |Function||函数返回结果作为表格容器|
|thList|[Optional]|false|如果 <em><strong>el</strong></em>为空, the <em><strong>thList</strong></em> 必须要设置，此字段创建表头部th的名称|
|  |Array||如果thList是数组，每一项的格式如下|
||@String| |表格头部th名称|
||@Object| ||
||@@text| |表格头部th名称|
||@@Object| |表格当前列是够可排序|
|columnNameList|Array|true|每一行对应的数据|
||@string||数据对象的key|
||@function||函数返回值作为数据显示|
|skin|String|false|皮肤，通过设置css class|
|rowClass|Array|false|动态设置每一行的css class|
||@string||作为每一行的class|
||@function||函数返回值作为每一行的class,函数参数为当前行序号|
|perNums|Number|false|显示的数据数量|
|events|Object|false|每一行设置的事件对象，比如：{'click #aa': 'getNums'}|
|eventsHandler|Object|false|事件对应的执行句柄,比如：{getNums': function(e, row){ }}  参数e为事件对象，参数row为object, row.data 获取当前行的数据 row.setData({}) 更新当前行的数据 row.refresh()刷新当前行|
|paginate|Boolean|false|是否显示分页|
|paginateBtns|Array|false|分页组件中“上一页”和“下一页”的element|
|multiselect|Boolean|是否可选|如果为true,表格左侧有一栏目复选框|

## 

### Examples

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