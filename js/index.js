/**
 * Created by setting on 2017/10/20 0020.
 */

var flag = false; //是否第二次选择节点
var tempData; //第一次点击记录
var tempNode; //第一次点击节点
var svgObj = {
    1: './svg/1.svg',
    2: './svg/2.svg',
    3: './svg/3.svg',
    4: './svg/4.svg',
    5: './svg/5.svg'
}; //选择节点的对应图标

//节点集合
var nodeList = [];
var width = 1000; //画布宽
var height = 600; //画布高
var allowPath = true; //是否允许线条跟随
var rang_y = 25;//节点圆心偏移量
var svg = d3.select('svg'); //画布


context.init({preventDoubleContext: false});
context.attach('g', [
    {header: 'Options'},
    {
        text: 'Del', href: '#', action: function (e) {
        var node = d3.select(context.t);
        var id = node.attr('id').match(/\d+/)[0];
        nodeList.splice(id, 1);
        node.remove();
        d3.selectAll('[from=node_' + id + ']')
            .filter(function () {
                d3.select(this).remove();
            });
        d3.selectAll('[to=node_' + id + ']')
            .filter(function () {
                d3.select(this).remove();
            });
        resetLine()
        drawNode();


    }
    }
]);

//连接线箭头
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

//拖拽结束
function allowDrop(ev) {
    ev.preventDefault();
}

//拖拽开始. 记录id等信息
function drag(ev) {
    ev.dataTransfer.setData("id", ev.target.id);
}

//计算画布边缘位置
function computedPositon(x_y, value) {
    var temp = value;
    switch (x_y) {
        case 'x':
            if (value <= 0) {
                temp = 0;
            }
            if (value >= width - 50) {
                temp = width - 50;
            }
            return temp;
            break;
        case 'y':
            if (value <= 0) {
                temp = 0;
            }
            if (value >= height - 50) {
                temp = height - 50;
            }
            return temp;
            break;
    }

}

//d3拖拽计算
function dragmove(d, j) {
    //计算边缘位置并为改节点重新赋值坐标
    d.nodeInfo.x = computedPositon('x', d3.event.x);
    d.nodeInfo.y = computedPositon('y', d3.event.y);

    //除开本节点后的所有节点集合
    var collsionArr = copyArr(nodeList, j);

    //获取离本节点最近的节点在数组中的索引
    var mindistances = getMindistances(d.nodeInfo.x, d.nodeInfo.y, collsionArr);


    //是否允许线条跟随.(节点碰撞后不允许跟随)
    if (allowPath) {
        var fromId = d.nodeInfo.from;

        var toPath = svg.selectAll('[from=' + fromId + ']');
        if (toPath.size() > 0) {
            toPath.filter(function () {
                var toD = d3.select(this).attr('d');
                toD = toD.replace(/L(\d+) (\d)+/, 'L' + (d.nodeInfo.x + 25) + ' ' + (d.nodeInfo.y + 25))
                console.log(000)
                d3.select(this).attr('d', toD);
            });

        }

        var toId = d.nodeInfo.to;
        var fromPath = svg.selectAll('[to=' + toId + ']');
        if (fromPath.size() > 0) {
            fromPath.filter(function () {
                var fromD = d3.select(this).attr('d');
                fromD = fromD.replace(/M(\d+) (\d)+/, 'M' + (d.nodeInfo.x + 25) + ' ' + (d.nodeInfo.y + 25))
                d3.select(this).attr('d', fromD)
            })
        }
    }

    if (mindistances > -1 && isCollsionWithRect(d.nodeInfo.x, d.nodeInfo.y, 50, 50, collsionArr[mindistances].nodeInfo.x, collsionArr[mindistances].nodeInfo.y)) {
        allowPath = false;
        return false;
    } else {
        allowPath = true;
    }
    d3.select(this)
        .attr('transform', 'translate(' + d.nodeInfo.x + ',' + d.nodeInfo.y + ')')

}



//获取相邻最小距离节点
function getMindistances(x, y, arr) {
    var distances = [];
    for (var i = 0; i < arr.length; i++) {
        distances.push(distanceCAL(x, y, arr[i].nodeInfo.x, arr[i].nodeInfo.y))
    }
    return distances.indexOf(Math.min.apply(Math, distances))
}

//计算两点之间的距离
function distanceCAL(x1, y1, x2, y2) {
    var calX = x2 - x1;
    var calY = y2 - y1;
    return Math.pow((calX * calX + calY * calY), 0.5);
}

//节点碰撞检测
function isCollsionWithRect(x1, y1, w, h, x2, y2) {
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

//拷贝出当前节点的节点数组
function copyArr(arr, j) {
    var temp = [];
    for (var i = 0; i < arr.length; i++) {
        if (i !== j) {
            temp.push(arr[i]);
        }
    }
    return temp;
}

//拖到到svg中
function drop(ev) {
    ev.preventDefault();
    var id = ev.dataTransfer.getData("id");
    if (id) {
        var x = computedPositon('x', ev.offsetX - 25);
        var y = computedPositon('y', ev.offsetY - 25);
        nodeList.push({
            nodeInfo: {
                x: x,
                y: y,
                styleId: id
            }
        });
        drawNode();
    }

}


//单击节点
function nodeClickHandle(g, d) {
    svg.selectAll('g')
        .filter(function (data) {
            if (data.nodeInfo.index === d.nodeInfo.index) {
                d3.select(this)
                    .style({
                        fill: 'none',
                        stroke: 'black',
                        'stroke-width': 1
                    })
                    //画虚线
                    .attr('stroke-dasharray', 8)
                    .select('rect')
                    .attr('class', 'strokedrect')
            } else {
                d3.select(this)
                    .style({
                        fill: 'none',
                        stroke: 'none',
                        'stroke-width': 0
                    })
            }
        });
    if (!flag) {
        tempData = d;
        tempNode = g;
        flag = true;
    } else {
        if (g === tempNode) {
            console.warn('不能选择当前节作为下级节点')
            return false
        }
        // if (d.nodeInfo.from) return false;
        if(d.nodeInfo.from && d.nodeInfo.from === tempData.nodeInfo.to){
            console.log(11)
        }
        svg.append('path')
            .attr('d', function () {
                return 'M' + (tempData.nodeInfo.x + rang_y) + ' ' + (tempData.nodeInfo.y + rang_y) + ' L' + (d.nodeInfo.x + rang_y) + ' ' + (d.nodeInfo.y + rang_y)
            })
            .attr("marker-end", "url(#end-arrow)")
            .attr('from', tempNode.attr('id'))
            .attr('to', g.attr('id'))
            .style({
                fill: 'none',
                stroke: 'black',
                'stroke-width': 1.5
            }).on('click',function(){
            console.log(111)
        })
            .on('mouseover',function(){
                d3.select(this).style({ stroke: '#fca326','stroke-width':2.8})
            })
            .on('mouseout',function(){
                d3.select(this).style({ stroke: 'black','stroke-width':1.5})
            })
        temp.nodeInfo.to = tempNode.attr('id');
        d.nodeInfo.from = g.attr('id');
        tempNode.select('circle')
            .attr('stroke-width', 1);
    }
}

function resetLine() {
    temp = null;
    flag = false;
}


function drawNode() {

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
        }).on("drag", dragmove); //绑定拖拽函数


    var g = svg.selectAll('g')
        .data(nodeList)
        .enter()
        .append('g')
        .attr('transform', function (d) {
            return 'translate(' + d.nodeInfo.x + ',' + d.nodeInfo.y + ')'
        })
        .attr('id', function (d, i) {
            d.nodeInfo.index = i;
            return 'node_' + i;
        });
    //画矩形
    g.append('rect')
        .attr('width', 50)
        .attr('height', 50)
        .style({
            fill: 'none'
        });
    //图片
    g.append('image')
        .attr('width', 50)
        .attr('height', 50)
        .attr('xlink:href', function (d) {
            return svgObj[d.nodeInfo.styleId]
        });
    //绑定单击事件
    g.on('click', function (d) {
        if (d3.event.defaultPrevented) return
        nodeClickHandle(g, d)
    });
    //console.log(nodeList)

    //绑定拖拽事件
    svg.selectAll('g')
        .call(drag1)
}




