import React, { useEffect, useRef, useState, useCallback } from 'react'
import './App.css'

const calcPoints = (
  containerSize: Dimension,
  tiles: TileParams = {
    width: 180,
    height: 240,
    padding: 10,
    rotate: 30,
  },
): Coordinates[] => {
  const rad = Math.PI / 180
  const rotateRad = tiles.rotate * rad

  const getNearPoints = (c: Coordinates): Coordinates[] => {
    const [x, y] = c
    return [
      [x + 1, y],
      [x, y + 1],
      [x - 1, y],
      [x, y - 1],
      [x + 1, y - 1],
      [x - 1, y + 1],
    ]
  }

  const calcRealCoordinates = (c: Coordinates): Coordinates => {
    const [x, y] = c
    const { width, height, padding } = tiles
    const xx = (width + padding) * Math.cos(rotateRad)
    const xy = (width + padding) * Math.sin(rotateRad)
    const yl = Math.sqrt((height + padding) ** 2 + ((width + padding) / 2) ** 2)
    const yd =
      Math.atan((2 * (height + padding)) / (width + padding)) + rotateRad
    const yx = yl * Math.cos(yd)
    const yy = yl * Math.sin(yd)

    return [x * xx + y * yx, x * xy + y * yy]
  }

  const isPointValid = (c: Coordinates): boolean => {
    const { width, height } = tiles
    const halfDiagonal = Math.sqrt(width ** 2 + height ** 2) / 2
    const diagonalAngle = Math.atan(height / width)
    const safeWidth = halfDiagonal * Math.cos(diagonalAngle - rotateRad)
    const safeHeight = halfDiagonal * Math.sin(diagonalAngle + rotateRad)

    const [x, y] = c
    if (Math.abs(x) > containerSize.width / 2 + safeWidth) {
      return false
    }
    if (Math.abs(y) > containerSize.height / 2 + safeHeight) {
      return false
    }
    return true
  }

  const hasCoordinates = (array: Coordinates[], c: Coordinates): boolean => {
    return array.filter((p) => p[0] === c[0] && p[1] === c[1]).length > 0
  }

  const res: Coordinates[] = [[0, 0]]
  let cursor = 0
  while (cursor < res.length) {
    res.push(
      ...getNearPoints(res[cursor])
        .filter((p) => !hasCoordinates(res, p))
        .filter((p) => isPointValid(calcRealCoordinates(p))),
    )
    cursor += 1
  }

  return res.map((p) => calcRealCoordinates(p))
}

const App: React.FC = () => {
  const el = useRef<HTMLDivElement | null>(null)
  const [observer, setObserver] = useState<ResizeObserver | null>(null)
  const [points, setPoints] = useState<Coordinates[]>([])

  const updateContainerSize = useCallback(() => {
    if (el.current) {
      const width = parseFloat(window.getComputedStyle(el.current).width)
      const height = parseFloat(window.getComputedStyle(el.current).height)
      setPoints(calcPoints({ width, height }))
    }
  }, [el])

  useEffect(() => {
    setObserver(
      new ResizeObserver(() => {
        updateContainerSize()
      }),
    )
  }, [updateContainerSize])

  useEffect(() => {
    if (el.current) {
      observer?.observe(el.current)
    }

    return (): void => {
      observer?.disconnect()
    }
  }, [el, observer])

  return (
    <div className="App" ref={el}>
      {points.map((p, idx) => (
        <div
          className="point"
          key={idx}
          style={{ left: `calc(50% + ${p[0]}px`, top: `calc(50% - ${p[1]}px)` }}
        />
      ))}
    </div>
  )
}

interface Dimension {
  width: number
  height: number
}

interface TileParams {
  width: number
  height: number
  padding: number
  rotate: number
}

type Coordinates = [number, number]

export default App
