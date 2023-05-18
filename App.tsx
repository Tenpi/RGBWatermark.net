import React, {useEffect, useState, useContext, useReducer} from "react"
import {Switch, Route, Redirect, useHistory, useLocation} from "react-router-dom"
import Context, {EnableDragContext, MobileContext} from "./Context"
import axios from "axios"
import functions from "./structures/Functions"
import HomePage from "./pages/HomePage"
import "./index.less"

require.context("./assets/icons", true)
require.context("./assets/misc", true)

const App: React.FunctionComponent = (props) => {
    const [ignored, forceUpdate] = useReducer(x => x + 1, 0)
    const [loaded, setLoaded] = useState(false)
    const [enableDrag, setEnableDrag] = useState(false)
    const [mobile, setMobile] = useState(false)

    useEffect(() => {
        functions.preventDragging()
        setTimeout(() => {
            setLoaded(true)
        }, 100)
    }, [])

    const history = useHistory()
    const location = useLocation()

    useEffect(() => {
        setTimeout(() => {
            if (mobile) {
                if (enableDrag) functions.dragScroll(false)
                return
            }
            functions.dragScroll(enableDrag)
        }, 100)
    }, [enableDrag, mobile, history])

    useEffect(() => {
        const mobileQuery = (query: any) => {
            if (query.matches) {
                setMobile(true)
            } else {
                setMobile(false)
            }
        }
        const media = window.matchMedia("(max-width: 700px)")
        media.addEventListener("change", mobileQuery)
        mobileQuery(media)
        document.documentElement.style.visibility = "visible"
    }, [])

    return (
        <div className={`app ${!loaded ? "stop-transitions" : ""}`}>
            <MobileContext.Provider value={{mobile, setMobile}}>
            <EnableDragContext.Provider value={{enableDrag, setEnableDrag}}>
                <Context>
                    <Switch>
                        <Route exact path={["/", "/home"]}><HomePage/></Route>
                        <Route path="*"><HomePage/></Route>
                    </Switch>
                </Context>
            </EnableDragContext.Provider>
            </MobileContext.Provider>
        </div>
    )
}

export default App