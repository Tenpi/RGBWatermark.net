import React, {useContext, useEffect, useState, useRef} from "react"
import {useHistory} from "react-router-dom"
import {HashLink as Link} from "react-router-hash-link"
import {EnableDragContext, MobileContext, HelpModeContext} from "../Context"
import functions from "../structures/Functions"
import HelpNavBar from "./HelpNavBar"
import "./styles/help.less"

/*import rainbowWatermarks from "../assets/images/protection methods/rainbowwatermarks.jpg"
import pointifiction from "../assets/images/protection methods/pointifiction.jpg"
import lineifiction from "../assets/images/protection methods/lineifiction.jpg"
import trifiction from "../assets/images/protection methods/trifiction.jpg"
import rectifiction from "../assets/images/protection methods/rectifiction.jpg"
import pixelshift from "../assets/images/protection methods/pixelshift.jpg"
import highcontrast from "../assets/images/protection methods/highcontrast.jpg"
import pixelation from "../assets/images/protection methods/pixelation.jpg"
import noise from "../assets/images/protection methods/noise.jpg"
import edgeblur from "../assets/images/protection methods/edgeblur.jpg"
import sprinkles from "../assets/images/protection methods/sprinkles.jpg"
import networkrandomizer from "../assets/images/protection methods/networkrandomizer.jpg"
import networkshifter from "../assets/images/protection methods/networkshifter.jpg"
import imageencryption from "../assets/images/protection methods/imageencryption.jpg"
import imagesplitting from "../assets/images/protection methods/imagesplitting.jpg"
import glaze from "../assets/images/protection methods/glaze.jpg"
import mist from "../assets/images/protection methods/mist.jpg"
import fileconversion from "../assets/images/protection methods/fileconversion.jpg"
import fileinflation from "../assets/images/protection methods/fileinflation.jpg"
import crt from "../assets/images/protection methods/crt.jpg"
import rgbsplit from "../assets/images/protection methods/rgbsplit.jpg"
import clipbreaker from "../assets/images/protection methods/clipbreaker.jpg"*/

const rainbowWatermarks = "https://i.imgur.com/IOnJNnG.png"
const pointifiction = "https://i.imgur.com/v8zOBpw.jpg"
const lineifiction = "https://i.imgur.com/oxmgltc.png"
const trifiction = "https://i.imgur.com/ZtfJFZQ.png"
const rectifiction = "https://i.imgur.com/2SyY6OW.png"
const pixelshift = "https://i.imgur.com/011deos.png"
const pixelation = "https://i.imgur.com/12MQpFk.png"
const highcontrast = "https://i.imgur.com/lRh8Fex.png"
const noise = "https://i.imgur.com/mqXKMSf.jpg"
const edgeblur = "https://i.imgur.com/ce1CCHL.png"
const sprinkles = "https://i.imgur.com/gHsI5zN.jpg"
const networkrandomizer = "https://i.imgur.com/EfzOjfj.png"
const networkshifter = "https://i.imgur.com/Xh7D243.png"
const imagesplitting = "https://i.imgur.com/hZVoeVE.png"
const imageencryption = "https://i.imgur.com/rgbZCHd.png"
const glaze = "https://i.imgur.com/q5tESPk.jpg"
const mist = "https://i.imgur.com/7XGUYjA.png"
const fence = "https://i.imgur.com/4wNnnd2.jpg"
const adversarialnoise = "https://i.imgur.com/R9OQybt.png"
const fileconversion = "https://i.imgur.com/zBe9hoE.png"
const fileinflation = "https://i.imgur.com/f776qKD.png"
const crt = "https://i.imgur.com/83Cuxdd.png"
const rgbsplit = "https://i.imgur.com/ykTCBhP.png"
const clipbreaker = "https://i.imgur.com/4NSP9gI.jpg"

let protectionMethods = [rainbowWatermarks, pointifiction, lineifiction, trifiction, 
    rectifiction, pixelshift, pixelation, highcontrast, noise, edgeblur, sprinkles, fence, 
    adversarialnoise, crt, rgbsplit, glaze, mist, fileconversion, fileinflation, networkrandomizer, 
    networkshifter, imageencryption, imagesplitting, clipbreaker]

/*
import aiarttheft1 from "../assets/images/ai art theft/aiarttheft1.jpg"
import aiarttheft2 from "../assets/images/ai art theft/aiarttheft2.jpg"
import aiarttheft3 from "../assets/images/ai art theft/aiarttheft3.jpg"
import aiarttheft4 from "../assets/images/ai art theft/aiarttheft4.jpg"
import aiarttheft5 from "../assets/images/ai art theft/aiarttheft5.jpg"
import aiarttheft6 from "../assets/images/ai art theft/aiarttheft6.jpg"*/

const aiarttheft1 = "https://i.imgur.com/86lXfQ9.jpg"
const aiarttheft2 = "https://i.imgur.com/plOJfAS.jpg"
const aiarttheft3 = "https://i.imgur.com/v7wtXUq.jpg"
const aiarttheft4 = "https://i.imgur.com/INjIj29.jpg"
const aiarttheft5 = "https://i.imgur.com/SFxMO4j.png"
const aiarttheft6 = "https://i.imgur.com/mGGmDMO.jpg"

let aiArtTheft = [aiarttheft1, aiarttheft2, aiarttheft3, aiarttheft4, aiarttheft5, aiarttheft6]

/*
import howaiartworks from "../assets/images/how ai art works/howaiartworks.jpg"
import howaiartworks2 from "../assets/images/how ai art works/howaiartworks2.jpg"*/

const howaiartworks = "https://i.imgur.com/VhAbIO4.jpg"
const howaiartworks2 = "https://i.imgur.com/2afb6XR.jpg"

let howAIArtWorks = [howaiartworks, howaiartworks2]

/*
import aiisuseless from "../assets/images/misc/aiisuseless.jpg"
import aiwatermark from "../assets/images/misc/aiwatermark.jpg"
import steganography from "../assets/images/misc/steganography.jpg"
import invisiblewatermark from "../assets/images/misc/invisiblewatermark.jpg"
import downscale from "../assets/images/misc/downscale.jpg"
import glyphswap from "../assets/images/misc/glyphswap.jpg"
import textspoof from "../assets/images/misc/textspoof.jpg"
import bitcrush from "../assets/images/misc/bitcrush.jpg"
import pitchshift from "../assets/images/misc/pitchshift.jpg"
import blockreverse from "../assets/images/misc/blockreverse.jpg"
import pinknoise from "../assets/images/misc/pinknoise.jpg"
import decimation from "../assets/images/misc/decimation.jpg"
import subdivision from "../assets/images/misc/subdivision.jpg"*/

const aiisuseless = "https://i.imgur.com/g9N7iqP.png"
const aiwatermark = "https://i.imgur.com/YxQHTMz.png"
const steganography = "https://i.imgur.com/gcuhJ33.png"
const invisiblewatermark = "https://i.imgur.com/zWIoEen.png"
const downscale = "https://i.imgur.com/g3206y7.png"
const glyphswap = "https://i.imgur.com/iBMMRQU.png"
const textspoof = "https://i.imgur.com/GnMmk3B.png"
const bitcrush = "https://i.imgur.com/VNjlhts.png"
const pitchshift = "https://i.imgur.com/r357CIS.jpg"
const blockreverse = "https://i.imgur.com/K1GkPWL.jpg"
const pinknoise = "https://i.imgur.com/1KY3mZn.png"
const decimation = "https://i.imgur.com/Q01rJMx.png"
const subdivision = "https://i.imgur.com/XNZkdJI.png"

let misc = [aiisuseless, aiwatermark, steganography, invisiblewatermark, downscale, glyphswap, 
            textspoof, bitcrush, pitchshift, blockreverse, pinknoise, decimation, subdivision]

const Help: React.FunctionComponent = (props) => {
    const {enableDrag, setEnableDrag} = useContext(EnableDragContext)
    const {mobile, setMobile} = useContext(MobileContext)
    const {helpMode, setHelpMode} = useContext(HelpModeContext)
    const ref = useRef<HTMLCanvasElement>(null)
    const history = useHistory()

    const generateRows = () => {
        let jsx = [] as any
        if (helpMode === "ai protection methods") {
            for (let i = 0; i < protectionMethods.length; i++) {
                jsx.push(
                    <div className="help-row">
                        <img className="help-img" crossOrigin="anonymous" src={protectionMethods[i]}/>
                    </div>
                )
            }
        } else if (helpMode === "ai art theft") {
            for (let i = 0; i < aiArtTheft.length; i++) {
                jsx.push(
                    <div className="help-row">
                        <img className="help-img" crossOrigin="anonymous" src={aiArtTheft[i]}/>
                    </div>
                )
            }
        } else if (helpMode === "how ai art works") {
            for (let i = 0; i < howAIArtWorks.length; i++) {
                jsx.push(
                    <div className="help-row">
                        <img className="help-img" crossOrigin="anonymous" src={howAIArtWorks[i]}/>
                    </div>
                )
            }
        } else if (helpMode === "misc") {
            for (let i = 0; i < misc.length; i++) {
                jsx.push(
                    <div className="help-row">
                        <img className="help-img" crossOrigin="anonymous" src={misc[i]}/>
                    </div>
                )
            }
        }
        return jsx
    }

    const getText = () => {
        if (helpMode === "ai protection methods") return "These are all the infographics I compiled explaining the effectiveness of these methods."
        if (helpMode === "ai art theft") return "These are all the infographics I compiled on AI art theft."
        if (helpMode === "how ai art works") return "These are all the infographics I compiled about how AI art works."
        if (helpMode === "misc") return "These are miscellaneous infographics."
    }

    return (
        <div className="help-wrapper">
            <HelpNavBar/>
            <div className="help" onMouseEnter={() => setEnableDrag(true)}>
                {/* <span className="help-text">{getText()}</span> */}
                <div className="help-image-container">
                    {generateRows()}
                </div>
            </div>
        </div>
    )
}

export default Help