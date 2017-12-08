const db = require('../../controllers/database')

// free icons from https://icons8.com/icon/pack/free-icons/all
const placeHolder = `<?xml version="1.0" encoding="utf-8"?>
<!-- Generator: Adobe Illustrator 18.1.1, SVG Export Plug-In . SVG Version: 6.00 Build 0)  -->
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" id="Layer_1" x="0px" y="0px" viewBox="0 0 32 32" enable-background="new 0 0 32 32" xml:space="preserve" width="96px" height="96px">
<rect x="3" y="6" fill="none" stroke="#000000" stroke-width="2" stroke-miterlimit="10" width="26" height="20"/>
<polyline fill="none" stroke="#000000" stroke-width="2" stroke-miterlimit="10" points="3,22.3 11,14.3 22.5,25.9 "/>
<polyline fill="none" stroke="#000000" stroke-width="2" stroke-miterlimit="10" points="17.4,20.9 22,16.3 28.9,23.2 "/>
<circle cx="24" cy="11" r="2"/>
</svg>`

module.exports = [
  (req, res, next) => {
    let id = req.params.photoId.toUpperCase()
    return db.Photos
      .findById(id)
      .then(photo => {
        req.resImage = photo === null
          ? { mimeType: 'image/svg+xml', data: Buffer.from(placeHolder) }
          : { mimeType: photo.mimeType, data: Buffer.from(photo.data) }
        next()
        return Promise.resolve()
      })
      .catch(error => next(error))
  }
]
