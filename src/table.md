the usage of Table.

var table = new Table(options);

options
	el  获取table的dom.
		- string          默认是table的id
		- jQuery对象      使用jquery获取table
		- function  必须有一个返回值
			返回值可以是jquery对象 或者是 string html.
		如果需要为某一列做排序
		该列dom结构为:
			<th>日期
				<div class="order-c"><i class="order-as" title="升序"></i><i class="order-des" title="降序"></i></div>
			</th>

	-ThList {Array} 
    	Thlist中的每一项的数据类型：
    		-String 作为th的值
    		-Object {text: '', isOrderBy: true | flase} text的值作为th的值，isOrderBy确定该列是否排序
	th的每一项值，用于动态创造table的dom结构，如果el和thlist同时存在，优先使用el。
	默认创造的table的dom结构为:
		'<table class="k-table">' +
            '<thead>' +
                '<tr></tr>' +
            '</thead>' +
            '<tbody></tbody>' +
         '</table>'

	paginate: true

	paginateBtns: [a, b] 

	perNums -每页的数量

	events {'click #aa': 'getNums'}
	eventsHandler: { getNums: function(){}}

	skin 最外层加class

	source 数据源   可能为Array|Function 为了适应同步或者异步获取数据的不同情境.
		- Array     table的数据源 
					格式为	[
						{name: 'lyc', old: 4, sex: '男4', birth: 2014},
						{name: 'pheart', old: 5, sex: '女5', birth: 2015},
						{name: 'zhangsan', old: 6, sex: '男6', birth: 2016}
					]

		- function(next)  如果数据是异步的 在function中异步获取数据datas  该function第一个参数为回调函数
						  异步取得数据以后 调用回调函数 next(), 并将数据data作为参数 table会进行后续逻辑.

	columnNameList 	Array 处理table每列显示的数据 数组中每个值可能为三种类型
						string        the key in key-value data
						function      第一个参数为行数据。例如：{name: 'lyc', old: 4, sex: '男4', birth: 2014}
						object 
							-name  the key in data 
							-className the class of tr of tag.

	rowClass    String | Function the current tr's  css class
					String 	class name
					Function  the first argument is index that current row's index  in table.



Table实例化后的对象table 支持的方法
	setEvents
		- {Object} 委托事件列表 
		- {Object} 事件绑定的回调函数  
					第一个参数为 jQuery 的event对象 
					第二个参数为 当前行对象 TableRow对象 
		使用方法如下：
		table.setEvents(
			{
				'click #edit': 'edit'
			},

			{
				edit: function(e, row) {
					row.set({name: 'liubei'});
					row.render();
				}
			}
		);

运行时候调用 run 方法.

Demo: 

var data = [
	{name: 'lyc', old: 4, sex: '男4', birth: 2014},
	{name: 'pheart', old: 5, sex: '女5', birth: 2015},
	{name: 'zhangsan', old: 6, sex: '男6', birth: 2016}
];

var table = new Table({
	columnNameList: [
		{ 
			name: 'name',
		 	className: 'firstcol'
		}, 
		'sex', 
		function(data) {
			return data.old * 2 - 1;
		},
		function(data) {
			var button = '<a href="javascript:;" id="edit">编辑</a><a href="javascript:;" id="delete">删除</a>';
			return button;
		}
	],
	//rowClass: 'abc',
	rowClass: function(index) {
		if (index%2 == 0) {
			return 'odd';
		} else {
			return 'even';
		}
	},
	//source: data
	source: function(next) {
		//==
		next(data);
	},
	//el: 'simpleTable',
	el: function() {
		//==
		var el = $('#Test_Table_Template').html();
		return el;
	}
});

table.setEvents(
	{
		'click #edit': 'edit',
		'click #delete': 'delete'
	},

	{
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
);

table.run();

$('#test').html(table.El);