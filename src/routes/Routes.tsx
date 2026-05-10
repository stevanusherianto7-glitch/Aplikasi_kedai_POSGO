import React from 'react'
import { useRoutes } from 'react-router-dom'
import { routes } from './index'

const Routes: React.FC = () => {
  const element = useRoutes(routes)
  
  return <>{element}</>
}

export default Routes
