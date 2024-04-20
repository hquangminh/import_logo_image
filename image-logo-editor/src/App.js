import React, { useState, useRef } from 'react'
import { Rnd } from 'react-rnd'
import Dropzone from 'react-dropzone'
import { saveAs } from 'file-saver'
import JSZip from 'jszip'
import './App.css'

function App() {
  const [images, setImages] = useState([])
  const [logos, setLogos] = useState({})
  const [logoPositions, setLogoPositions] = useState({})
  const [logoSizes, setLogoSizes] = useState({})
  const containerRefs = useRef([])

  const handleImageDrop = (acceptedFiles) => {
    acceptedFiles.forEach((file) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const id = Date.now()
        setImages((prev) => [...prev, { src: e.target.result, id }])
      }
      reader.readAsDataURL(file)
    })
  }

  const handleLogoDrop = (id, acceptedFiles) => {
    const file = acceptedFiles[0]
    const reader = new FileReader()
    reader.onload = (e) => {
      setLogos((prev) => ({ ...prev, [id]: e.target.result }))
    }
    reader.readAsDataURL(file)
  }

  const downloadAllImages = () => {
    const zip = new JSZip()
    let imagesProcessed = 0

    images.forEach((image, index) => {
      if (!containerRefs.current[index]) {
        console.error(`Container for image ${image.id} is not defined.`)
        return
      }

      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()
      img.src = image.src

      img.onload = () => {
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
        ctx.drawImage(img, 0, 0)

        const logo = logos[image.id]
        if (logo) {
          const logoImg = new Image()
          logoImg.src = logo

          logoImg.onload = () => {
            // Ensure container and logo details are available
            const container = containerRefs.current[index]
            if (!container) {
              console.error(`Container for image ${image.id} is not defined.`)
              return
            }

            const scaleX = img.naturalWidth / container.offsetWidth
            const scaleY = img.naturalHeight / container.offsetHeight
            const logoPosition = logoPositions[image.id]
            const logoSize = logoSizes[image.id]

            // Use the user-set dimensions directly, applying the scale
            const logoWidth = logoSize ? logoSize.width * scaleX : logoImg.naturalWidth
            const logoHeight = logoSize ? logoSize.height * scaleY : logoImg.naturalHeight
            const posX = logoPosition ? logoPosition.x * scaleX : 0
            const posY = logoPosition ? logoPosition.y * scaleY : 0

            // Now draw the logo at the correct position and size
            ctx.drawImage(logoImg, posX, posY, logoWidth, logoHeight)
            finalizeImage()
          }
        } else {
          finalizeImage()
        }
      }

      const finalizeImage = () => {
        canvas.toBlob((blob) => {
          zip.file(`edited-image-${image.id}.png`, blob)
          imagesProcessed++
          if (imagesProcessed === images.length) {
            zip.generateAsync({ type: 'blob' }).then((content) => {
              saveAs(content, 'images.zip')
            })
          }
        })
      }
    })
  }

  return (
    <div className='App' style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100vh' }}>
      <h1>Image Logo Editor</h1>
      <Dropzone onDrop={handleImageDrop}>
        {({ getRootProps, getInputProps }) => (
          <div {...getRootProps()} style={{ width: 300, height: 50, border: '1px solid black', marginBottom: 20 }}>
            <input {...getInputProps()} />
            <p className='button_drag_image'>Drag 'n' drop image files here, or click to select files</p>
          </div>
        )}
      </Dropzone>
      {images.map((image, index) => (
        <div className='container' key={image.id} ref={(el) => (containerRefs.current[index] = el)}>
          <img src={image.src} alt={`Background ${index}`} style={{ maxWidth: '100%', maxHeight: '100%', position: 'absolute' }} />
          <Dropzone onDrop={(files) => handleLogoDrop(image.id, files)}>
            {({ getRootProps, getInputProps }) => (
              <div
                {...getRootProps()}
                style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: 'rgba(255,255,255,0.5)',
                }}>
                <input {...getInputProps()} />
                {!logos[image.id] && <p>Drag 'n' drop a logo here, or click to select a logo</p>}
              </div>
            )}
          </Dropzone>
          {logos[image.id] && (
            <Rnd
              style={{
                position: 'absolute',
                zIndex: 10,
                border: '1px solid #ddd',
                background: `url(${logos[image.id]}) no-repeat center / contain`,
              }}
              size={logoSizes[image.id] || { width: 100, height: 100 }}
              position={logoPositions[image.id] || { x: 50, y: 50 }}
              bounds='parent'
              onDragStop={(e, d) => {
                setLogoPositions((prev) => ({ ...prev, [image.id]: { x: d.x, y: d.y } }))
              }}
              onResizeStop={(e, direction, ref, delta, position) => {
                setLogoSizes((prev) => ({
                  ...prev,
                  [image.id]: {
                    width: ref.offsetWidth,
                    height: ref.offsetHeight,
                  },
                }))
                setLogoPositions((prev) => ({ ...prev, [image.id]: position }))
              }}
            />
          )}
        </div>
      ))}
      <button className='button_download' onClick={downloadAllImages} style={{ marginTop: '20px' }}>
        Download All Images
      </button>
    </div>
  )
}

export default App
