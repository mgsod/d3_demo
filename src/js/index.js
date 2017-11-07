/**
 * Created by setting on 2017/10/31 0031.
 */
var Node = require('./node.js');

var NODE_SETTING = {
    1: {
        img: 'static/svg/1.svg',
        data: {
            name: '数据抓取',
            test: {
                a: 1
            }
        },
        color: '#ffad33'
    },
    2: {
        img: 'static/svg/2.svg',
        data: {
            name: '输出',
            test: {
                a: 1
            }
        }
    },
    3: {
        img: 'static/svg/3.svg',
        data: {
            name: '评估',
            test: {
                a: 1
            }
        }
    },
    4: {
        img: 'static/svg/4.svg',
        data: {
            name: '算法',
            test: {
                a: 1
            }
        }

    },
    5: {
        img: 'static/svg/5.svg',
        data: {
            name: '数据抓取',
            test: {
                a: 1
            }
        }

    }
};

var nodeList = [];//节点集合

var Vue_nodeList = new Vue({
    name: 'nodeList',
    el: '#NodeList',
    data: {
        nodeList: [
            {
                name: '数据抓取',
                type: '1'
            },
            {
                name: '数据抓取111',
                type: '1'
            },
            {
                name: '读取',
                type: '2'
            },
            {
                name: '输入',
                type: '3'
            },
            {
                name: '输出',
                type: '4'
            },
            {
                name: '输出5',
                type: '4'
            },
            {
                name: '输出4',
                type: '4'
            },
            {
                name: '输出3',
                type: '4'
            },
            {
                name: '输出2',
                type: '4'
            },
            {
                name: '输出1',
                type: '4'
            },
            {
                name: '编辑',
                type: '5'
            }],
        content: [],
        name: '',
        tabList: [
            {name: '数据', type: 1},
            {name: '输出', type: 2},
            {name: '评估', type: 3},
            {name: '算法', type: 4}
        ],
        select: 1,
        isShow: true
    },
    mounted: function () {
        this.changeTab()

    },
    filters: {
        getImg: function (item) {
            return NODE_SETTING[item.type].img
        }
    },
    methods: {
        tabClick: function (type) {
            this.select = type;
            this.isShow = true;
            this.changeTab()
        },
        changeTab: function () {
            var _this = this;
            this.content = this.nodeList.filter(function (v) {
                if (_this.select == v.type) return v;
            })
            for (var i = 0; i < this.tabList.length; i++) {
                if (this.tabList[i].type == _this.select) {
                    this.name = this.tabList[i].name;
                }
            }
        },
        toggle: function () {
            this.isShow = !this.isShow
        },
        dragstart: function (e) {
            drag(e)
        },
        line: function () {
            Node.isLine = true;
            Node.restDasharray();
        }

    }
});

var Vue_setting = new Vue({
    name: 'nodeSetting',
    el: '#setting',
    data: {
        type: -1,
        name: '',
        data: {
            1: {
                name: '',
                process: "",
                dataSource: '',
                dataSourceType: ''
            }
        },
        isShow: false
    },
    methods: {
        toggle: function () {
            this.isShow = !this.isShow
        }
    }

});

$('#canvas').on('dragover', function (e) {
    allowDrop(e.originalEvent)
});
$('#canvas').on('drop', function (e) {
    drop(e.originalEvent)
});
$('#canvas').on('click', function (e) {
    Vue_setting.isShow = false;

});


Node.init({
    canvas: d3.select('svg'),
    nodeList: nodeList,
    nodeSetting: NODE_SETTING,
    nodeWidth: 50,
    vue_setting: Vue_setting,
    onNodeClick: function () {
        Vue_setting.isShow = true;
    },
    onDrawLine: function () {

        Node.saveNodeInfo();
    },
    onCreateNode: function (d) {
        Vue_setting.isShow = true;
        Node.saveNodeInfo();
    }
});
nodeList = Node.nodeList


//初始化右键菜单插件
context.init({preventDoublecontext: false});

//绑定节点右键菜单
context.attach('.node', [
    {header: 'Options'},
    {
        text: 'Del', href: '#', action: function (e) {
        var node = d3.select(context.target);
        Node.delNode(node);
    }
    }
]);

//绑定线条右键菜单
context.attach('.line', [
    {header: 'Options'},
    {
        text: 'Del', href: '#', action: function (e) {
        var path = d3.select(context.target);
        Node.delPath(path)
    }
    }
]);

//html5拖拽结束 阻止默认行为
function allowDrop(ev) {
    ev.preventDefault();
}

/**
 * html5拖拽
 * @param ev 拖拽的事件对象
 */
function drag(ev) {
    ev.dataTransfer.setData("index", $(ev.target).attr('data-index'));
    ev.dataTransfer.setData("type", $(ev.target).attr('data-type'));
}

/**
 * 从菜单中拖到svg画布的函数
 * @param ev  拖拽的事件对象
 */
function drop(ev) {
    ev.preventDefault();
    //获取拖拽时设置的id属性
    var index = ev.dataTransfer.getData("index");
    var type = ev.dataTransfer.getData("type");
    if (index) {
        var x = Node.computedPosition('x', ev.offsetX - Node.nodeOffset);
        var y = Node.computedPosition('y', ev.offsetY - Node.nodeOffset);

        //记录新增节点
        nodeList.push({
            nodeInfo: {
                x: x,
                y: y,
                type:type
            },
            data: $.extend(true, {}, Vue_nodeList.content[index])
        });

        //在svg上创建对应节点
        Node.createNode();

    }

}
