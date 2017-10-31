/**
 * Created by setting on 2017/10/31 0031.
 */


var NODE_SETTING = {
    1: {
        img: './svg/1.svg',
        data: {
            name: '数据抓取',
            test:{
                a:1
            }
        },
        color: '#ffad33'
    },
    2: {
        img: './svg/2.svg',
        color: '#23b7e5'
    },
    3: {
        img: './svg/3.svg',
        color: '#7266ba'
    },
    4: {
        img: './svg/4.svg',
        color: '#f05050'
    },
    5: {
        img: './svg/5.svg',
        color: '#27c24c'
    }
};

var nodeList = [];//节点集合

var v_nodeList = new Vue({
    el: '#NodeList',
    data: {
        nodeList: [
            {
                name: '数据抓取',
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
                name: '编辑',
                type: '5'
            }]
    },
    mounted: function () {
        $('.node-item img').on('dragstart', function (e) {
            drag(e.originalEvent)
        });
    },
    filters: {
        getImg: function (item) {
            return NODE_SETTING[item.type].img
        }
    }
});

var v_nodeSetting = new Vue({
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
        }
    },
    methods: {}

});

$('#canvas').on('dragover', function (e) {
    allowDrop(e.originalEvent)
});
$('#canvas').on('drop', function (e) {
    drop(e.originalEvent)
});

Node.init({
    canvas:d3.select('svg'),
    nodeList:nodeList,
    nodeSetting:NODE_SETTING
});





//初始化右键菜单插件
context.init({preventDoubleContext: false});

toastr.options = {
    "closeButton": true,
    "debug": false,
    "progressBar": false,
    "positionClass": "toast-top-center",
    "onclick": null,
    "showDuration": "300",
    "hideDuration": "1000",
    "timeOut": "3000",
    "extendedTimeOut": "1000",
    "showEasing": "swing",
    "hideEasing": "swing",
    "showMethod": "fadeIn",
    "hideMethod": "slideUp"
};

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
    ev.dataTransfer.setData("type", $(ev.target).attr('data-type'));
}


/**
 * 从菜单中拖到svg画布的函数
 * @param ev  拖拽的事件对象
 */
function drop(ev) {
    ev.preventDefault();
    //获取拖拽时设置的id属性
    var type = ev.dataTransfer.getData("type");
    if (type) {
        var x = Node.computedPosition('x', ev.offsetX - Node.nodeOffset);
        var y = Node.computedPosition('y', ev.offsetY - Node.nodeOffset);
        //记录新增节点
        //包括坐标和节点的styleId [styleId用来指定拖拽到svg后显示的图标]
        nodeList.push({
            nodeInfo: {
                x: x,
                y: y,
                type: type
            },
            data: $.extend(true,{}, NODE_SETTING[type].data)
        });

        //在svg上创建对应节点
        Node.createNode();
    }

}
