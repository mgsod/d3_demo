var NODE_SETTING = {
    1: {
        img: './svg/1.svg'
    },
    2: {
        img: './svg/2.svg'
    },
    3: {
        img: './svg/3.svg'
    },
    4: {
        img: './svg/4.svg'
    },
    5: {
        img: './svg/5.svg'
    }
};


/**
 * 左侧节点面板
 */
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
    filters:{
        getImg:function(item){
            return NODE_SETTING[item.type].img
        }
    }
});

var v_nodeSetting = new Vue({

})
$('#canvas').on('dragover', function (e) {
    allowDrop(e.originalEvent)
});
$('#canvas').on('drop', function (e) {
    drop(e.originalEvent)
});

//svg节点属性字典

var nodeList = [];//节点集合
var svgWidth = 1200; //画布宽
var svgHeight = 600;//画布高
var nodeWidth = 50; //节点宽
var nodeHeight = 50; //节点高
var allowPath = true; //是否允许Path跟随
var nodeOffset = 25;//节点圆心偏移量 [目前是50*50大小节点.圆心为50/2,]
var isSelectStart = false; //连线时判断是否已经选择起始节点
var selectedNodeData; //连线时 已选择节点的节点数据
var selectedNode; // 已选择的节点
var pathColor = '#565656';
var adsorptionIntensity = 20; //节点和画布边缘的吸附强度
var svg = d3.select('svg');
window.onload = setSvgSize;
window.onresize = setSvgSize;


/**
 * 设置画布大小
 */
function setSvgSize() {
    svgWidth = $('.canvas').width();
    svgHeight = $(window).height() - 60;
    $('.bgContainer,svg').css(
        {
            'width': svgWidth,
            'height': svgHeight
        })
}


/**
 * 定义d3拖拽.包括设置拖拽时的圆心位置
 */
var drag1 = d3.behavior.drag()
    .origin(function () {
        //以鼠标点击的位置作为拖动的圆心.防止开始拖动时抖动
        var t = d3.select(this);
        var transform = (t.attr('transform'));
        var reg = /\w*\((\d+),(\d+)\)/;
        var x_y = transform.match(reg);
        return {
            x: x_y[1],
            y: x_y[2]
        }
    }).on("drag", dragMove); //绑定拖拽函数

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
        delNode(node);
    }
    }
]);

//绑定线条右键菜单
context.attach('.line', [
    {header: 'Options'},
    {
        text: 'Del', href: '#', action: function (e) {
        /*  console.log(context.target)*/
        var path = d3.select(context.target);
        delPath(path)
    }
    }
]);

//绘制线条箭头
svg.append('svg:defs').append('svg:marker')
    .attr('id', 'end-arrow')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 10)
    .attr('markerWidth', 6)//箭头参数适当按需调整
    .attr('markerHeight', 10)
    .attr('orient', 'auto')
    .append('svg:path')
    .attr('d', 'M0,-5L10,0L0,5')//绘制箭头形状
    .attr('fill', pathColor);


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
        var x = computedPosition('x', ev.offsetX - nodeOffset);
        var y = computedPosition('y', ev.offsetY - nodeOffset);
        //记录新增节点
        //包括坐标和节点的styleId [styleId用来指定拖拽到svg后显示的图标]
        nodeList.push({
            nodeInfo: {
                x: x,
                y: y,
                type: type
            }
        });

        //在svg上创建对应节点
        createNode();
    }

}

/**
 * 创建节点
 */
function createNode() {
    var g = svg.selectAll('g')
        .data(nodeList)
        .enter()
        .append('g')
        .attr('transform', function (d) {
            //设置g元素坐标
            return 'translate(' + d.nodeInfo.x + ',' + d.nodeInfo.y + ')'
        })
        .attr('class', 'node')
        .attr('id', function (d) {
            //设置节点名称
            var name = d.nodeInfo.name;
            if (!name) {
                //如果是新建则取时间戳作为唯一名
                var time = new Date().getTime();
                d.nodeInfo.name = 'node_' + time;
                return 'node_' + time;
            } else {
                //如果更新节点则以之前名为命名
                d.nodeInfo.name = name;
                return 'node_' + name;
            }

        });

    //画矩形
    g.append('rect')
        .attr('width', nodeWidth)
        .attr('height', nodeHeight)
        .style({
            fill: 'none'
        });
    //图片
    g.append('image')
        .attr('width', nodeWidth)
        .attr('height', nodeHeight)
        .attr('xlink:href', function (d) {
            return NODE_SETTING[d.nodeInfo.type].img
        });
    //绑定单击事件
    g.on('click', function (d) {
        if (d3.event.defaultPrevented) return; //防止拖动触发单击事件
        nodeSelect(g, d);


    });
    g.append('polygon')
        .attr('points', '53,15 53,35 65,25')
        .attr('fill', '#fff')
        .attr('stroke', '#ffad33')
        .attr('stroke-width', 1.5)
        .classed('polygon show', true)
        .on('click', function (d) {
            d3.select(this)
                .attr('fill', '#ffad33');
            d3.event.stopPropagation();
            drawLine(g, d);

        }).on('mouseover', function () {
        d3.select(this)
            .classed('show', true);
    }).on('mouseout', function () {

    });

    //绑定拖拽事件
    svg.selectAll('g')
        .call(drag1);
}


/**
 * 删除节点
 * @param node 选中的节点对象[d3]
 */
function delNode(node) {
    var name = node.attr('id');
    node.remove();
    nodeList.splice(getNodeIndexByName(nodeList, name), 1);
    d3.selectAll('[from=' + name + ']')
        .filter(function () {
            delPath(d3.select(this), 'from');

        });
    d3.selectAll('[to=' + name + ']')
        .filter(function () {
            delPath(d3.select(this),'to');
        });


    //绑定拖拽事件
    svg.selectAll('g')
        .call(drag1);
    selectedNodeData = null;
}

/**
 * 拖拽函数 [d3]
 * @param _nodeData
 * @param _nodeIndex
 * @returns {boolean}
 */
function dragMove(_nodeData, _nodeIndex) {
    //将进行边缘碰撞计算后的值赋值给节点对象的x,y.
    _nodeData.nodeInfo.x = computedPosition('x', d3.event.x);
    _nodeData.nodeInfo.y = computedPosition('y', d3.event.y);

    //除开本节点 其他需要进行碰撞检测的节点
    var collisionArr = copyArr(nodeList, _nodeIndex);
    //获取其他节点离本节点最近的节点索引
    var minDistances = getMinDistanceIndex(_nodeData.nodeInfo.x, _nodeData.nodeInfo.y, collisionArr);


    //判断节点拖动时. 是否需要线条跟随
    if (allowPath) {
        var name = _nodeData.nodeInfo.name;
        var toPath = svg.selectAll('[to=' + name + ']');
        var fromPath = svg.selectAll('[from=' + name + ']');
        if (toPath.size() > 0) {
            toPath.filter(function () {
                var toD = d3.select(this).attr('d');
                //正则获取并替换线条的终点               //加上偏移量 以让箭头指向圆心
                toD = toD.replace(/L(\d+) (\d)+/, 'L' + (_nodeData.nodeInfo.x + nodeOffset) + ' ' + (_nodeData.nodeInfo.y + nodeOffset));
                d3.select(this).attr('d', toD);
            });
        }

        if (fromPath.size() > 0) {
            fromPath.filter(function () {
                var fromD = d3.select(this).attr('d');
                //正则获取并替换线条的起点                   //加上偏移量 以让箭头指向圆心
                fromD = fromD.replace(/M(\d+) (\d)+/, 'M' + (_nodeData.nodeInfo.x + nodeOffset) + ' ' + (_nodeData.nodeInfo.y + nodeOffset));
                d3.select(this).attr('d', fromD)
            })
        }
    }
    //判断是否有节点可以碰撞. 如果有则拖动结束
    if (minDistances > -1 && isCollisionWithRect(_nodeData.nodeInfo.x, _nodeData.nodeInfo.y, nodeWidth, nodeHeight, collisionArr[minDistances].nodeInfo.x, collisionArr[minDistances].nodeInfo.y)) {
        allowPath = false;
        return false;
    } else {
        allowPath = true;
    }
    d3.select(this)
        .attr('transform', 'translate(' + _nodeData.nodeInfo.x + ',' + _nodeData.nodeInfo.y + ')')
}


/**
 *  单击节点.(连线)
 * @param _node 当前点击节点
 * @param _nodeData 当前点击节点上的数据
 * @returns {boolean}
 */
function drawLine(_node, _nodeData) {
    if (!isSelectStart) {
        selectedNodeData = _nodeData;
        selectedNode = _node;
        isSelectStart = true;
    } else {
        if (_node === selectedNode) {
            toastr['warning']("不能选择当前节作为下级节点");
            restLine(_node);
            return false
        }
        if (_nodeData.nodeInfo.from && _nodeData.nodeInfo.from.indexOf(selectedNodeData.nodeInfo.name) > -1) {
            toastr['warning']("此节点已经是当前节点的下级");
            restLine(_node);
            return false;
        }
        if (_nodeData.nodeInfo.to && _nodeData.nodeInfo.to.indexOf(selectedNodeData.nodeInfo.name) > -1) {
            toastr['warning']("此节点是当前节点的上级,不可作为下级节点");
            restLine(_node);
            return false;
        }
        svg.append('path')
            .attr('d', function () {
                return 'M' + (selectedNodeData.nodeInfo.x + nodeOffset) + ' ' + (selectedNodeData.nodeInfo.y + nodeOffset) + ' L' + (_nodeData.nodeInfo.x + nodeOffset) + ' ' + (_nodeData.nodeInfo.y + nodeOffset)
            })
            .attr("marker-end", "url(#end-arrow)")
            .attr('from', selectedNodeData.nodeInfo.name)
            .attr('to', _nodeData.nodeInfo.name)
            .attr('class', 'line')
            .style({
                fill: 'none',
                stroke: pathColor,
                'stroke-width': 1.5
            })
            .on('mouseover', function () {
                d3.select(this).style({stroke: '#ffad33', 'stroke-width': 2.8})
            })
            .on('mouseout', function () {
                d3.select(this).style({stroke: pathColor, 'stroke-width': 1.5})
            });

        selectedNodeData.nodeInfo.to = selectedNodeData.nodeInfo.to || [];
        selectedNodeData.nodeInfo.to.push(_nodeData.nodeInfo.name);

        _nodeData.nodeInfo.from = _nodeData.nodeInfo.from || [];
        _nodeData.nodeInfo.from.push(selectedNodeData.nodeInfo.name);


        restLine(_node)
    }
}

/**
 *  移除线条
 * @param path 线条
 * @param tag [not required]
 * 如果传入to 则移除起始节点里的to对应的项
 * 如果传入from 则移除终点节点里的from对应的项
 * 如果未传入则视为仅仅删除线条 移除起点和终点中对应的项
 */
function delPath(path, tag) {
    var path_to = path.attr('to');
    var path_from = path.attr('from');


    if (!tag || tag === "from") {
        //移除终点节点中from的项
        var index_to = getNodeIndexByName(nodeList, path_to);
        var toNode = nodeList[index_to];
        index_to && toNode.nodeInfo.from.splice(toNode.nodeInfo.from.indexOf(path_from), 1);
    }

    if (!tag || tag === "to") {
        //移除起点节点中to的项
        var index_from = getNodeIndexByName(nodeList, path_from);
        var fromNode = nodeList[index_from];
        index_from && fromNode.nodeInfo.to.splice(fromNode.nodeInfo.to.indexOf(path_to), 1);
    }

    //移除元素
    path.remove();

}


/**
 * 重置线条样式 [连线完成或者连线出错后重置线条]
 * @param _node 当前选中的节点
 */
function restLine(_node) {
    setTimeout(function () {
        selectedNode.select('polygon')
            .attr('fill', '#fff');
        _node.select('polygon')
            .attr('fill', '#fff')
    }, 1100);
    selectedNodeData = null;
    isSelectStart = false;

}

/**
 * 单击节点.选中节点
 * @param _node 当前节点对象
 * @param _nodeData 节点数据
 */
function nodeSelect(_node, _nodeData) {
    console.log(_nodeData)
    svg.selectAll('g')
        .filter(function (data) {
            if (data.nodeInfo.name === _nodeData.nodeInfo.name) {
                var _this = d3.select(this);
                _this.style({
                    fill: 'none',
                    stroke: 'black',
                    'stroke-width': 1
                }).select('rect')
                    .attr('stroke-dasharray', 8)
                    .attr('class', 'strokedrect');

            } else {
                d3.select(this)
                    .style({
                        fill: 'none',
                        stroke: 'none',
                        'stroke-width': 0
                    })
                    .select('polygon')
                    .classed('show', false)
            }
        });

}


/**
 * 通过节点name获取当前节点在节点集合中的索引
 * @param arr 节点集合
 * @param name 节点名
 * @returns {number} 节点索引
 */
function getNodeIndexByName(arr, name) {
    for (var i = 0; i < arr.length; i++) {
        if (arr[i].nodeInfo.name === name) {
            return i;
        }
    }
}

/**
 * 计算节点坐标是否超出画布边缘 并返回合适的坐标
 * @param x_y 计算x 或 y 轴
 * @param value 需要计算的值
 * @returns {temp} 返回的合适数值
 */
function computedPosition(x_y, value) {
    var temp = value;
    switch (x_y) {
        case 'x':
            if (value <= 0 || value <= adsorptionIntensity) {
                temp = 0;
            }
            if (value >= svgWidth - nodeWidth || value >= svgWidth - nodeWidth - adsorptionIntensity) {
                temp = svgWidth - nodeWidth;
            }
            return parseInt(temp);
            break;
        case 'y':
            if (value <= 0 || value <= adsorptionIntensity) {
                temp = 0;
            }
            if (value >= svgHeight - nodeHeight || value >= svgHeight - nodeHeight - adsorptionIntensity) {
                temp = svgHeight - nodeHeight;
            }
            return parseInt(temp);
            break;
    }
}

/**
 *  获取当前节点和其距离最短的节点在节点集合中的索引
 * @param x 当前节点x坐标
 * @param y 当前节点y坐标
 * @param arr 节点集合
 * @returns {number}
 */
function getMinDistanceIndex(x, y, arr) {
    var distances = [];
    for (var i = 0; i < arr.length; i++) {
        distances.push(getDistance(x, y, arr[i].nodeInfo.x, arr[i].nodeInfo.y))
    }
    return distances.indexOf(Math.min.apply(Math, distances))
}

/**
 * 计算两节点距离
 * @param x1  当前节点x坐标
 * @param y1  当前节点y坐标
 * @param x2  另一节点x坐标
 * @param y2  另一节点y坐标
 * @returns {number} 返回距离
 */
function getDistance(x1, y1, x2, y2) {
    var calX = x2 - x1;
    var calY = y2 - y1;
    return Math.pow((calX * calX + calY * calY), 0.5);
}

/**
 * 拷贝一个除开指定索引的新数组
 * @param arr 要拷贝的数组
 * @param j   要忽略的项的索引
 * @returns {Array} 返回新数组
 */
function copyArr(arr, j) {
    var temp = [];
    for (var i = 0; i < arr.length; i++) {
        if (i !== j) {
            temp.push(arr[i]);
        }
    }
    return temp;
}

/**
 * 节点碰撞检测 [矩形]
 * @param x1 当前节点x
 * @param y1 ......y
 * @param w  节点宽
 * @param h  节点高
 * @param x2 距离最短节点x
 * @param y2 ......y
 * @returns {boolean}
 */
function isCollisionWithRect(x1, y1, w, h, x2, y2) {
    if (x1 >= x2 && x1 >= x2 + w) {
        return false;
    } else if (x1 <= x2 && x1 + w <= x2) {
        return false;
    } else if (y1 >= y2 && y1 >= y2 + h) {
        return false;
    } else if (y1 <= y2 && y1 + h <= y2) {
        return false;
    }
    return true;
}
