the usage of Table.

var table = new Table(options);

options
	el  获取容器，参数类型可为：
			- string          默认是id
			- jQuery对象      使用jquery获取table
			- function  必须有一个返回值 返回值可以是jquery对象 或者是 string html.
		传递的el，必须依赖于table的外层元素
			<div id="tableCon">
				<table>
					....
				</table>
			</div>
		如果需要为某一列做排序,只需在该列th元素内添加指定dom  <div class="order-c">  ...   </div>，如下:
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

	paginate: 默认为true  不需要使用false

	paginateBtns: [a, b]  翻页组件上一页  和  下一页 层内元素，常用作修改该按钮的样式。

	perNums -每页的数量

	source 数据源   可能为Array|Function 为了适应同步或者异步获取数据的不同情境.
		- Array     table的数据源 
					格式为	[
						{name: 'lyc', old: 4, sex: '男4', birth: 2014},
						{name: 'pheart', old: 5, sex: '女5', birth: 2015},
						{name: 'zhangsan', old: 6, sex: '男6', birth: 2016}
					]

		- function(o,next,opt)  如果数据是异步的 在function中异步获取数据datas  
			o  {Object} {currentPage：''} 传递翻页序号
			next {Function} 调用此函数，传递{datas: '该页表格显示的数据', totalPage: '总页数'}
			opt {Object} 状态。 默认是{type: 'normal'}  使用排序以后 值变为{type: 'orderBy', key: '排序列的key值（columnNameList传递的当前列的key值）'}

	events {'click #aa': 'getNums'} 定义依赖于每一行的事件
	eventsHandler: { getNums: function(e, row){}}  
		每一行的事件执行句柄 执行函数有两个参数，
			第一个参数是事件源
			第二个参数是该行的对象row，常会用到的： 】
				row.data  获取该行的数据   
				row.setData({}) 修改该行的数据
				row.refresh() 修改数据后，实时刷新该行

	skin 在最外层容器加class 如  skin: 'my-skin' 

	columnNameList 	Array 处理table每列显示的数据 数组中每个值可能为三种类型
						string        the key in key-value data
						function      第一个参数为行数据。 返回值作为td标签内显示的内容
						object 
							-name  the key in data 
							-className the class of tr of tag.

	rowClass    用于动态的设置每一行的class   默认奇数行为even  偶数行为odd
				参数类型： 
				- string 作为每行的class
				- function 返回值作为每一行的class,如下 函数第一个参数为当前行的序列，可通过对不用序列，返回不同的class
					{
						rowClass: function(index) {
							if (index % 2) {
								return 'odd'
							} ...
						}
					}


一、
var data = [
	{name: 'lyc', old: 4, sex: '男4', birth: 2014},
	{name: 'pheart', old: 5, sex: '女5', birth: 2015},
	{name: 'zhangsan', old: 6, sex: '男6', birth: 2016}
];

var table = new Table({
	el: 'simpleTable',
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


二、

var table = new Table({
	thList: []
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
	source: function(o, next, opt) { // opt为状态对象，可根据该值 获取请求不同的异步接口。
		var currentPage = o.currentPage;
		// 异步获取数据的操作.
		server.getUsers({ //传递的参数
			page: currentPage
		}, function(resp){  // 相应返回函数
			/* resp = {
				datas: [	{name: 'lyc', old: 4, sex: '男4', birth: 2014},
							{name: 'pheart', old: 5, sex: '女5', birth: 2015},
							{name: 'zhangsan', old: 6, sex: '男6', birth: 2016}],
				totalPages: 5 
			} */  假设数据类型为如此
			next({datas: resp.datas, totalPage: resp.totalPages});
		})
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