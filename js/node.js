/**
 * Created by setting on 2017/10/31 0031.
 */
var alert = require('./toastr.min');
module.exports = {
    /**
     * 初始化可视化节点操作
     * @param options
     */
    init: function (options) {
        this.vue_setting = options.vue_setting;
        this.canvas = options.canvas; //画布
        this.nodeSetting = options.nodeSetting; //节点属性
        this.nodeList = options.nodeList; //节点列表 公用属性
        this.nodeWidth = options.nodeWidth || 50; //节点宽 默认50
        this.nodeHeight = options.nodeHeight || 50; //节点高 默认50
        this.adsorptionIntensity = options.adsorptionIntensity || 20; //边缘吸附强度

        this.isSelectStart = false; //是否已经选择起始节点
        this.selectedNode = null;// 已选择的节点
        this.selectedNodeData = null;//连线时 已选择节点的节点数据

        this.nodeOffset = this.nodeWidth / 2; //节点圆心偏移量 [目前是50*50大小节点.圆心为50/2,]
        this.pathColor = options.pathColor || '#565656'; //线条颜色 默认 '#565656'
        this.allowPath = false; //拖拽节点时是否允许线条跟随

        //event
        this.onNodeClick = options.onNodeClick;
        this.onDrawLine = options.onDrawLine;
        this.onCreateNode = options.onCreateNode


        window.onload = setSvgSize(this);
        window.onresize = setSvgSize(this);

        function setSvgSize(_this) {

            _this.svgWidth = $('.canvas').width();
            _this.svgHeight = $(window).height() - 60;
            $('.bgContainer,svg').css(
                {
                    'width': _this.svgWidth,
                    'height': _this.svgHeight
                })
        }
        alert.options = {
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

        this.canvas.append('svg:defs').append('svg:marker')
            .attr('id', 'end-arrow')
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 10)
            .attr('markerWidth', 6)//箭头参数适当按需调整
            .attr('markerHeight', 10)
            .attr('orient', 'auto')
            .append('svg:path')
            .attr('d', 'M0,-5L10,0L0,5')//绘制箭头形状
            .attr('fill', this.pathColor);

    },

    /**
     * 创建节点
     */
    createNode: function () {
        var _this = this;

        var g = _this.canvas.selectAll('g')
            .data(_this.nodeList)
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
                _this.onCreateNode(d);
                if (!name) {
                    //如果是新建则取时间戳作为唯一名
                    var time = new Date().getTime();
                    d.nodeInfo.name = 'node_1' + time;
                    return 'node_' + time;
                } else {
                    //如果更新节点则以之前名为命名
                    d.nodeInfo.name = name;
                    return 'node_' + name;
                }

            });

        //画矩形
        g.append('rect')
            .attr('width', _this.nodeWidth)
            .attr('height', _this.nodeHeight)
            .style({
                fill: 'none'
            });
        //图片
        g.append('image')
            .attr('width', _this.nodeWidth)
            .attr('height', _this.nodeHeight)
            .attr('xlink:href', function (d) {
                return _this.nodeSetting[d.nodeInfo.type].img
            });
        //绑定单击事件
        g.on('click', function (d) {
            if (d3.event.defaultPrevented) return; //防止拖动触发单击事件
            _this.clickNode(g, d);


        });

        g.append('polygon')
            .attr('points', '53,15 53,35 65,25')
            .attr('fill', '#fff')
            .attr('stroke', function (d) {
                return _this.nodeSetting[d.nodeInfo.type].color
            })
            .attr('stroke-width', 1)
            .classed('polygon show', true)
            .on('click', function (d) {
                d3.select(this)
                    .attr('fill', function (d) {
                        return _this.nodeSetting[d.nodeInfo.type].color
                    });
                d3.event.stopPropagation();
                _this.drawLine(g, d);
            });
        /*g.append('circle')
            .attr('cx',55)
            .attr('cy',25)
            .attr('r',10)
            .attr('fill','#fff')
            .attr('stroke-width',1)
            .classed('polygon show', true)
            .attr('stroke',function(d){
                return Node.nodeSetting[d.nodeInfo.type].color
            }).on('click', function (d) {
            d3.select(this)
                .attr('fill', function (d) {
                    return Node.nodeSetting[d.nodeInfo.type].color
                });
            d3.event.stopPropagation();
            Node.drawLine(g, d);
        });*/

        //绑定拖拽事件
        _this.canvas.selectAll('g')
            .call(_this.drag(_this));


    },

    /**
     * 定义d3拖拽.包括设置拖拽时的圆心位置
     */
    drag: function (_this) {
        return d3.behavior.drag()
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
            }).on("drag", _this.dragMove(_this)); //绑定拖拽函数

    },

    /**
     * 拖拽函数 [d3]
     * @param _nodeData
     * @param _nodeIndex
     * @returns {boolean}
     */
    dragMove: function (_this) {
        return function(_nodeData,_nodeIndex){
            //将进行边缘碰撞计算后的值赋值给节点对象的x,y.
            _nodeData.nodeInfo.x = _this.computedPosition('x', d3.event.x);
            _nodeData.nodeInfo.y = _this.computedPosition('y', d3.event.y);
            console.log(_this.svgWidth)
            //除开本节点 其他需要进行碰撞检测的节点
            var collisionArr = _this.copyArr(_this.nodeList, _nodeIndex);
            //获取其他节点离本节点最近的节点索引
            var minDistances = _this.getMinDistanceIndex(_nodeData.nodeInfo.x, _nodeData.nodeInfo.y, collisionArr);


            //判断节点拖动时. 是否需要线条跟随
            if (_this.allowPath) {
                var name = _nodeData.nodeInfo.name;
                var toPath = _this.canvas.selectAll('[to=' + name + ']');
                var fromPath = _this.canvas.selectAll('[from=' + name + ']');
                if (toPath.size() > 0) {
                    toPath.filter(function () {
                        var toD = d3.select(this).attr('d');
                        //正则获取并替换线条的终点               //加上偏移量 以让箭头指向圆心
                        toD = toD.replace(/L(\d+) (\d)+/, 'L' + (_nodeData.nodeInfo.x + _this.nodeOffset) + ' ' + (_nodeData.nodeInfo.y + _this.nodeOffset));
                        d3.select(this).attr('d', toD);
                    });
                }

                if (fromPath.size() > 0) {
                    fromPath.filter(function () {
                        var fromD = d3.select(this).attr('d');
                        //正则获取并替换线条的起点                   //加上偏移量 以让箭头指向圆心
                        fromD = fromD.replace(/M(\d+) (\d)+/, 'M' + (_nodeData.nodeInfo.x + _this.nodeOffset) + ' ' + (_nodeData.nodeInfo.y + _this.nodeOffset));
                        d3.select(this).attr('d', fromD)
                    })
                }
            }
            //判断是否有节点可以碰撞. 如果有则拖动结束
            if (minDistances > -1 && _this.isCollisionWithRect(_nodeData.nodeInfo.x, _nodeData.nodeInfo.y, _this.nodeWidth, _this.nodeHeight, collisionArr[minDistances].nodeInfo.x, collisionArr[minDistances].nodeInfo.y)) {
                _this.allowPath = false;
                return false;
            } else {
                _this.allowPath = true;
            }
            d3.select(this)
                .attr('transform', 'translate(' + _nodeData.nodeInfo.x + ',' + _nodeData.nodeInfo.y + ')')
        }

    },

    /**
     * 单击节点.选中节点
     * @param _node 当前节点对象
     * @param _nodeData 节点数据
     */
    clickNode: function (_node, _nodeData) {
        var _this = this;
        var type = _nodeData.nodeInfo.type;
        var data = _nodeData.data;
        var name = _nodeData.nodeInfo.name;
        _this.vue_setting.type = type;
        _this.vue_setting.data[type] = data;
        _this.vue_setting.name = name;
        _this.canvas.selectAll('g')
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

        this.onNodeClick && this.onNodeClick();
    },

    /**
     *  节点连线
     * @param _node 当前点击节点
     * @param _nodeData 当前点击节点上的数据
     * @returns {boolean}
     */
    drawLine: function (_node, _nodeData) {
        var _this = this;
        if (!_this.isSelectStart) {
            _this.selectedNodeData = _nodeData;
            _this.selectedNode = _node;
            _this.isSelectStart = true;
        } else {
            if (_node === _this.selectedNode) {
                alert['warning']("不能选择当前节作为下级节点");
                _this.restLine(_node);
                return false
            }
            if (_nodeData.nodeInfo.from && _nodeData.nodeInfo.from.indexOf(_this.selectedNodeData.nodeInfo.name) > -1) {
                alert['warning']("此节点已经是当前节点的下级");
                _this.restLine(_node);
                return false;
            }
            if (_nodeData.nodeInfo.to && _nodeData.nodeInfo.to.indexOf(_this.selectedNodeData.nodeInfo.name) > -1) {
                alert['warning']("此节点是当前节点的上级,不可作为下级节点");
                _this.restLine(_node);
                return false;
            }
            _this.canvas.append('path')
                .attr('d', function () {
                    return 'M' + (_this.selectedNodeData.nodeInfo.x + _this.nodeOffset) + ' ' + (_this.selectedNodeData.nodeInfo.y + _this.nodeOffset) + ' L' + (_nodeData.nodeInfo.x + _this.nodeOffset) + ' ' + (_nodeData.nodeInfo.y + _this.nodeOffset)
                })
                .attr("marker-end", "url(#end-arrow)")
                .attr('from', _this.selectedNodeData.nodeInfo.name)
                .attr('to', _nodeData.nodeInfo.name)
                .attr('class', 'line')
                .style({
                    fill: 'none',
                    stroke: _this.pathColor,
                    'stroke-width': 1.5
                })
                .on('mouseover', function () {
                    d3.select(this).style({stroke: '#ffad33', 'stroke-width': 2.8})
                })
                .on('mouseout', function () {
                    d3.select(this).style({stroke: _this.pathColor, 'stroke-width': 1.5})
                });

            _this.selectedNodeData.nodeInfo.to = _this.selectedNodeData.nodeInfo.to || [];
            _this.selectedNodeData.nodeInfo.to.push(_nodeData.nodeInfo.name);

            _nodeData.nodeInfo.from = _nodeData.nodeInfo.from || [];
            _nodeData.nodeInfo.from.push(_this.selectedNodeData.nodeInfo.name);

            this.onDrawLine && this.onDrawLine();

            _this.restLine(_node)
        }
    },

    /**
     *  移除线条
     * @param path 线条
     * @param tag [not required]
     * 如果传入to 则移除起始节点里的to对应的项
     * 如果传入from 则移除终点节点里的from对应的项
     * 如果未传入则视为仅仅删除线条 移除起点和终点中对应的项
     */
    delPath: function (path, tag) {
        var _this = this;
        var path_to = path.attr('to');
        var path_from = path.attr('from');


        if (!tag || tag === "from") {
            //移除终点节点中from的项
            var index_to = _this.getNodeIndexByName(_this.nodeList, path_to);
            var toNode = nodeList[index_to];
            index_to && toNode.nodeInfo.from.splice(toNode.nodeInfo.from.indexOf(path_from), 1);
        }

        if (!tag || tag === "to") {
            //移除起点节点中to的项
            var index_from = _this.getNodeIndexByName(_this.nodeList, path_from);
            var fromNode = _this.nodeList[index_from];
            index_from && fromNode.nodeInfo.to.splice(fromNode.nodeInfo.to.indexOf(path_to), 1);
        }

        //移除元素
        path.remove();
    },

    /**
     * 删除节点
     * @param node 选中的节点对象[d3]
     */
    delNode: function (node) {
        var _this = this;
        var name = node.attr('id');
        node.remove();
        _this.nodeList.splice(_this.getNodeIndexByName(_this.nodeList, name), 1);
        d3.selectAll('[from=' + name + ']')
            .filter(function () {
                _this.delPath(d3.select(this), 'from');

            });
        d3.selectAll('[to=' + name + ']')
            .filter(function () {
                _this.delPath(d3.select(this), 'to');
            });


        //绑定拖拽事件
        _this.canvas.selectAll('g')
            .call(_this.drag(_this));
        _this.selectedNodeData = null;
    },

    /**
     * 重置线条样式 [连线完成或者连线出错后重置线条]
     * @param _node 当前选中的节点
     */
    restLine: function (_node) {
        var _this = this;
        setTimeout(function () {
            _this.selectedNode.select('polygon')
                .attr('fill', '#fff');
            _node.select('polygon')
                .attr('fill', '#fff')
        }, 1100);
        _this.selectedNodeData = null;
        _this.isSelectStart = false;
    },

    /**
     * 计算节点坐标是否超出画布边缘 并返回合适的坐标
     * @param x_y 计算x 或 y 轴
     * @param value 需要计算的值
     * @returns {temp} 返回的合适数值
     */
    computedPosition: function (x_y, value) {
        var _this = this;
        var temp = value;
        switch (x_y) {
            case 'x':
                if (value <= 0 || value <= _this.adsorptionIntensity) {
                    temp = 0;
                }
                if (value >= _this.svgWidth - _this.nodeWidth || value >= _this.svgWidth - _this.nodeWidth - _this.adsorptionIntensity) {
                    temp = _this.svgWidth - _this.nodeWidth;
                }
                return parseInt(temp);
                break;
            case 'y':
                if (value <= 0 || value <= _this.adsorptionIntensity) {
                    temp = 0;
                }
                if (value >= _this.svgHeight - _this.nodeHeight || value >= _this.svgHeight - _this.nodeHeight - _this.adsorptionIntensity) {
                    temp = _this.svgHeight - _this.nodeHeight;
                }
                return parseInt(temp);
                break;
        }
    },

    /**
     * 通过节点name获取当前节点在节点集合中的索引
     * @param arr 节点集合
     * @param name 节点名
     * @returns {number} 节点索引
     */
    getNodeIndexByName: function (arr, name) {
        for (var i = 0; i < arr.length; i++) {
            if (arr[i].nodeInfo.name === name) {
                return i;
            }
        }
    },

    /**
     *  获取当前节点和其距离最短的节点在节点集合中的索引
     * @param x 当前节点x坐标
     * @param y 当前节点y坐标
     * @param arr 节点集合
     * @returns {number}
     */
    getMinDistanceIndex: function (x, y, arr) {
        var _this = this;
        var distances = [];
        for (var i = 0; i < arr.length; i++) {
            distances.push(_this.getDistance(x, y, arr[i].nodeInfo.x, arr[i].nodeInfo.y))
        }
        return distances.indexOf(Math.min.apply(Math, distances))
    },

    /**
     * 计算两节点距离
     * @param x1  当前节点x坐标
     * @param y1  当前节点y坐标
     * @param x2  另一节点x坐标
     * @param y2  另一节点y坐标
     * @returns {number} 返回距离
     */
    getDistance: function (x1, y1, x2, y2) {
        var calX = x2 - x1;
        var calY = y2 - y1;
        return Math.pow((calX * calX + calY * calY), 0.5);
    },

    /**
     * 拷贝一个除开指定索引的新数组
     * @param arr 要拷贝的数组
     * @param j   要忽略的项的索引
     * @returns {Array} 返回新数组
     */
    copyArr: function (arr, j) {
        var temp = [];
        for (var i = 0; i < arr.length; i++) {
            if (i !== j) {
                temp.push(arr[i]);
            }
        }
        return temp;
    },

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
    isCollisionWithRect: function (x1, y1, w, h, x2, y2) {
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
};