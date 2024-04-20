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
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()
      img.src = image.src

      img.onload = () => {
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

        const logo = logos[image.id]
        if (logo) {
          const logoImg = new Image()
          logoImg.src = logo
          logoImg.onload = () => {
            // Use the recorded size and position
            const position = logoPositions[image.id]
            const size = logoSizes[image.id]

            // Draw the logo on the canvas
            ctx.drawImage(logoImg, position.x, position.y, size.width, size.height)
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
          <img src={image.src} alt='Background' className='image' />
          <Dropzone onDrop={(files) => handleLogoDrop(image.id, files)}>
            {({ getRootProps, getInputProps }) => (
              <div {...getRootProps()} className='dropzone'>
                <input {...getInputProps()} />
                {!logos[image.id] && <p>Drag 'n' drop a logo here, or click to select a logo</p>}
              </div>
            )}
          </Dropzone>
          {logos[image.id] && (
            <Rnd
              bounds='parent'
              size={logoSizes[image.id]}
              position={logoPositions[image.id]}
              onDragStop={(e, d) => {
                const container = containerRefs.current[index]
                // Calculate relative position
                setLogoPositions((prev) => ({
                  ...prev,
                  [image.id]: { x: (d.x / container.offsetWidth) * img.naturalWidth, y: (d.y / container.offsetHeight) * img.naturalHeight },
                }))
              }}
              onResizeStop={(e, direction, ref, delta, position) => {
                const container = containerRefs.current[index]
                // Calculate relative size
                setLogoSizes((prev) => ({
                  ...prev,
                  [image.id]: {
                    width: (ref.offsetWidth / container.offsetWidth) * img.naturalWidth,
                    height: (ref.offsetHeight / container.offsetHeight) * img.naturalHeight,
                  },
                }))
                // Calculate relative position
                setLogoPositions((prev) => ({
                  ...prev,
                  [image.id]: {
                    x: (position.x / container.offsetWidth) * img.naturalWidth,
                    y: (position.y / container.offsetHeight) * img.naturalHeight,
                  },
                }))
              }}
              style={{
                position: 'absolute',
                zIndex: 10,
                border: '1px solid #ddd',
                background: `url(${logos[image.id]}) no-repeat center / contain`,
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
