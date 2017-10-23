//svg节点属性字典
var svgObj = {
    1: './svg/1.svg',
    2: './svg/2.svg',
    3: './svg/3.svg',
    4: './svg/4.svg',
    5: './svg/5.svg'
};

var nodeList = [];//节点集合
var svgWidth = 1000; //画布宽
var svgHeight = 600;//画布高
var nodeWidth = 50; //节点宽
var nodeHeight = 50; //节点高
var allowPath = true; //是否允许Path跟随
var nodeOffset = 25;//节点圆心偏移量
var svg = d3.select('svg'); //画布对象
var isSelectStart = false; //连线时判断是否已经选择起始节点
var selectedNodeData; //连线时 已选择节点的节点数据
var selectedNode; // 已选择的节点


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

//绑定节点右键菜单
context.attach('g', [
    {header: 'Options'},
    {
        text: 'Del', href: '#', action: function (e) {
        var node = d3.select(context.t);
        delNode(node);
    }
    }
]);

/**
 * 删除节点
 * @param node 选中的节点对象[d3]
 */
function delNode(node) {
    var name = node.attr('id');
    nodeList.splice(getNodeIndexByName(nodeList, name), 1);
    node.remove();
    d3.selectAll('[from=' + name + ']')
        .filter(function () {
            d3.select(this).remove();
        });
    d3.selectAll('[to=' + name + ']')
        .filter(function () {
            d3.select(this).remove();
        });

    //绑定拖拽事件
    svg.selectAll('g')
        .call(drag1)
    selectedNodeData = null;
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

svg.append('svg:defs').append('svg:marker')
    .attr('id', 'end-arrow')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 10)
    .attr('markerWidth', 6)//箭头参数适当按需调整
    .attr('markerHeight', 10)
    .attr('orient', 'auto')
    .append('svg:path')
    .attr('d', 'M0,-5L10,0L0,5')//绘制箭头形状
    .attr('fill', 'black');

//html5拖拽结束 阻止默认行为
function allowDrop(ev) {
    ev.preventDefault();
}

/**
 * html5拖拽
 * @param ev 拖拽的事件对象
 */
function drag(ev) {
    ev.dataTransfer.setData("id", ev.target.id);
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
            if (value <= 0) {
                temp = 0;
            }
            if (value >= svgWidth - 50) {
                temp = svgWidth - 50;
            }
            return temp;
            break;
        case 'y':
            if (value <= 0) {
                temp = 0;
            }
            if (value >= svgHeight - 50) {
                temp = svgHeight - 50;
            }
            return temp;
            break;
    }
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
 * 从菜单中拖到svg画布的函数
 * @param ev  拖拽的事件对象
 */
function drop(ev) {
    ev.preventDefault();
    //获取拖拽时设置的id属性
    var id = ev.dataTransfer.getData("id");
    if (id) {
        var x = computedPosition('x', ev.offsetX - 25);
        var y = computedPosition('y', ev.offsetY - 25);
        //记录新增节点
        //包括坐标和节点的styleId [styleId用来指定拖拽到svg后显示的图标]
        nodeList.push({
            nodeInfo: {
                x: x,
                y: y,
                styleId: id
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
            return svgObj[d.nodeInfo.styleId]
        });
    //绑定单击事件
    g.on('click', function (d) {
        if (d3.event.defaultPrevented) return; //防止拖动触发单击事件
       // nodeClickHandle(g, d);
        nodeSelect(g,d)
        console.log(1)


    });
    g.append('polygon')
        .attr('points', '53,15 53,35 65,25')
        .attr('fill', 'none')
        .attr('stroke', '#ffad33')
        .attr('stroke-width', 1.5)
        .classed('polygon show', true)
        .on('click', function (d,i,e) {
            d3.select(this)
                .attr('fill', '#ffad33');
            d3.event.stopPropagation();

            nodeClickHandle(g, d);


        }).on('mouseover', function () {
        d3.select(this)
            .classed('show', true)
            .attr('fill', '#ffad33')
    }).on('mouseout', function () {

            d3.select(this)
                .classed('show', false)
                .attr('fill', 'none')


    });


    //绑定拖拽事件
    svg.selectAll('g')
        .call(drag1);

}


/**
 *  单击节点.(连线)
 * @param _node 当前点击节点
 * @param _nodeData 当前点击节点上的数据
 * @returns {boolean}
 */
function nodeClickHandle(_node, _nodeData) {

    if (!isSelectStart) {
        selectedNodeData = _nodeData;
        selectedNode = _node;
        isSelectStart = true;

    } else {
        if (_node === selectedNode) {
            console.log('不能选择当前节作为下级节点');
            return false
        }
        svg.append('path')
            .attr('d', function () {
                return 'M' + (selectedNodeData.nodeInfo.x + nodeOffset) + ' ' + (selectedNodeData.nodeInfo.y + nodeOffset) + ' L' + (_nodeData.nodeInfo.x + nodeOffset) + ' ' + (_nodeData.nodeInfo.y + nodeOffset)
            })
            .attr("marker-end", "url(#end-arrow)")
            .attr('from', selectedNodeData.nodeInfo.name)
            .attr('to', _nodeData.nodeInfo.name)
            .style({
                fill: 'none',
                stroke: 'black',
                'stroke-width': 1.5
            }).on('click', function () {

        })
            .on('mouseover', function () {
                d3.select(this).style({stroke: '#fca326', 'stroke-width': 2.8})
            })
            .on('mouseout', function () {
                d3.select(this).style({stroke: 'black', 'stroke-width': 1.5})
            });
        selectedNode.select('circle')
            .attr('stroke-width', 1);
        selectedNodeData = null;
        isSelectStart = false
    }
}

function nodeSelect(_node, _nodeData){
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
