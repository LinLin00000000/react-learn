import React, { useEffect, useRef } from 'react'
import Chart from 'chart.js/auto'
import zoomPlugin from 'chartjs-plugin-zoom' // 引入 zoom 插件
import './ChartComponent.css' // 假设你将样式放在单独的 CSS 文件中

function ChartComponent() {
  const chartRefs = useRef({})

  useEffect(() => {
    // 注册 zoom 插件
    Chart.register(zoomPlugin)

    const fetchData = () => {
      // 读取 market_data.json 文件
      fetch(`${process.env.REACT_APP_API_URL}/market_data`)
        .then(response => response.json())
        .then(data => {
          // 处理数据
          // 为x轴显示日期，为tooltip显示完整信息准备两种格式的数据
          const labels = data.map(item =>
            new Date(item.created_at).toLocaleString('en-US', {
              month: '2-digit',
              day: '2-digit',
            })
          )
          const fullDateTimeLabels = data.map(item =>
            new Date(item.created_at)
              .toLocaleString('en-US', {
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false,
              })
              .replace(/(\d{2})\/(\d{2})\/\d{4},\s/, '$1/$2 ')
          )

          // 获取所有数据集的键，排除 created_at, id, updated_at, currentDate, huanbiDate, tongbiDate
          const datasetsKeys = Object.keys(data[0]).filter(
            key =>
              ![
                'created_at',
                'id',
                'updated_at',
                'currentDate',
                'huanbiDate',
                'tongbiDate',
              ].includes(key)
          )

          // 销毁之前的图表实例（如果存在）
          Object.values(chartRefs.current).forEach(ref => {
            if (ref) {
              ref.destroy()
            }
          })

          // 清空现有的图表容器
          const chartContainer = document.querySelector('.chart-grid')
          chartContainer.innerHTML = ''

          // 创建新的图表容器
          datasetsKeys.forEach((key, index) => {
            const chartId = key
            const chartData = data.map(item => parseFloat(item[key]) || 0)

            // 创建一个新的图表容器
            const chartSection = document.createElement('div')
            chartSection.className = 'chart-section'
            chartSection.innerHTML = `
              <h3>${key}</h3>
              <canvas id="${chartId}Chart"></canvas>
            `

            chartContainer.appendChild(chartSection)

            // 创建图表实例
            createChart(
              chartId,
              labels,
              chartData,
              key,
              `rgba(${Math.floor(Math.random() * 256)}, ${Math.floor(
                Math.random() * 256
              )}, ${Math.floor(Math.random() * 256)}, 0.4)`,
              `rgba(${Math.floor(Math.random() * 256)}, ${Math.floor(
                Math.random() * 256
              )}, ${Math.floor(Math.random() * 256)}, 1)`,
              fullDateTimeLabels
            )
          })
        })
        .catch(error => console.error('Error loading market data:', error))
    }

    // 初始数据获取
    fetchData()

    // 设置定时器，每半小时更新一次数据
    const intervalId = setInterval(fetchData, 30 * 60 * 1000)

    // 在effect内部保存当前的refs引用
    const currentChartRefs = chartRefs.current

    // 清理函数，在组件卸载时销毁所有图表实例并清除定时器
    return () => {
      Object.values(currentChartRefs).forEach(ref => {
        if (ref) {
          ref.destroy()
        }
      })
      clearInterval(intervalId)
    }
  }, [])

  const createChart = (
    chartId,
    labels,
    data,
    label,
    backgroundColor,
    borderColor,
    fullDateTimeLabels
  ) => {
    const ctx = document.getElementById(`${chartId}Chart`).getContext('2d')
    chartRefs.current[chartId] = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: label,
            data: data,
            fill: false,
            backgroundColor: backgroundColor,
            borderColor: borderColor,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'top',
          },
          tooltip: {
            callbacks: {
              title: function (tooltipItems) {
                return fullDateTimeLabels[tooltipItems[0].dataIndex]
              },
              label: function (context) {
                return `${context.dataset.label}: ${context.parsed.y}`
              },
            },
          },
          zoom: {
            pan: {
              enabled: true,
              mode: 'x',
              threshold: 20,
            },
            zoom: {
              wheel: {
                enabled: true,
                speed: 0.05,
              },
              pinch: {
                enabled: true,
                mode: 'x',
                speed: 0.05,
              },
              mode: 'xy',
            },
          },
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Date',
            },
          },
          y: {
            title: {
              display: true,
              text: label,
            },
          },
        },
      },
    })
  }

  return (
    <div className="chart-container">
      <h2>Historical Trading Data</h2>
      <div className="chart-grid">
        {/* 初始的 chart-section 会被动态替换 */}
      </div>
    </div>
  )
}

export default ChartComponent
