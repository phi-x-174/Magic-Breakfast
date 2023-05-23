/*
 * Copyright 2022 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
/* eslint-disable no-console, class-methods-use-this */
 


class DefaultTransformer {


   /**
    * Get the main DOMElement for this transformer.
    * Some transformers may want to operate on body, but some may want main.
    * Default prefers main.
    */ 
   getMain(document) {
      return document.querySelector('main') || document.querySelector('body');
   }

   getScore(document) {
    return 1;
   }

   /**
    * Remove unwanted elements from the main before its output.
    */
   removeElements(main, document) {
      WebImporter.DOMUtils.remove(document, [ '#pageHeader', 'footer', 'noscript', '.cookie-preference-container', '#termly-code-snippet-support'] );
   }


   /**
    * Create the metadata block and inset it as the first element of the dom so it appears at the
    * top of the markdown or at the top of the docx
    */ 
   createMetadataBlock(main, document) {
      const meta = {};
      // find the <title> element



      meta.Title = document.querySelector('head meta[property="og:title"]')?.content || 
            document.querySelector('title')?.innerHTML.replace(/[\n\t]/gm, '') ||
            "tbd";
      // find the <meta property="og:description"> element
      meta.ShortDescription = document.querySelector('head meta[name="description"]')?.content || 
         "";

      meta.Description = document.querySelector('head meta[property="og:description"]')?.content || 
         "no description";

      meta.Type = document.querySelector('head meta[property="og:type"]')?.content || 
         "";

      meta.Keywords = document.querySelector('head meta[name="keywords"]')?.content || 
         "";

      meta.SiteName = document.querySelector('head meta[property="og:site_name"]')?.content || 
         "";

      meta.Language = document.querySelector('head meta[http-eqiv="Content-Language"]')?.lang ||
         document.querySelector('head meta[property="og:locale"]')?.content ||
         "en-us";



     // find the <meta property="og:image"> element
      const img = document.querySelector('head meta[property="og:image"]');
      if (img) {
        // create an <img> element
        const el = document.createElement('img');
        el.src = img.content;
        meta.Image = el;
      }


      const body = document.querySelector('body');
      meta.pageClass = document.querySelector('body')?.className?.split(' ')[0] ||
         "unknown page class";

      console.log("Meta is ",meta);
      // helper to create the metadata block
      const block = WebImporter.Blocks.getMetadataBlock(document, meta);

      // append the block to the main element
      main.append(block);

      // returning the meta object might be usefull to other rules
      return meta;
   }


   createResources(main, document, originalURL)  {
      // find all videos and add them as links  
   }
   /**
    * Create all the blocks for this type of document.
    * The default only creates a Marquee
    * This is called before other methods, and 
    * It can decide where the block is inserted into the output dom.
    */ 
   createBlocks(main, document) {

    let carousel = document.querySelector('.pageWrapper .carousel');
    if ( carousel ) {
        const cells = [];
        cells.push(['header_carousel']);
        let carouselSlides = carousel.querySelectorAll('.carouselSlide');
        for (let carouselSlide of carouselSlides ) {
            cells.push([carouselSlide.innerHTML]);
        }
        let headerText = carousel.querySelector('.headerText');
        cells.push([headerText.innerHTML]);
        const table = WebImporter.DOMUtils.createTable(cells, document);
        carousel.innerHTML = "";
        carousel.append(table);
    }
    

    // remove the post feed wrapper and replace with a block.
    let postFeedWrapper = document.querySelector('.pageWrapper .postFeedWrapper');
    if ( postFeedWrapper ) {
        const cells = [];
        cells.push(['postFeed']);
        const table = WebImporter.DOMUtils.createTable(cells, document);
        postFeedWrapper.innerHTML = "";
        postFeedWrapper.append(table);

    }
    }



}

// list of available transformers
const transformers = [
  new DefaultTransformer()
];


const detectTransformer= (document) => {
   const matches = [];
   for (var transformer of transformers ) {
      matches.push({ t: transformer, score: transformer.getScore(document)});
   }
   matches.sort((a, b) => { return b.score - a.score});
   console.log("Transformer detection returned ",matches[0]);
   return matches[0].t;
}


export default {

   /**
    * Apply DOM operations to the provided document and return
    * the root element to be then transformed to Markdown.
    * @param {HTMLDocument} document The document
    * @returns {HTMLElement} The root element
    */
   transformDOM: async ({ document, url, html, params  }) => {

      const transformer = detectTransformer(document);
      const main = transformer.getMain(document);
      transformer.createBlocks(main, document);
      transformer.createResources(main, document, url);
      transformer.createMetadataBlock(main, document);
      transformer.removeElements(main, document);
      return main;
   },

   /**
    * Return a path that describes the document being transformed (file name, nesting...).
    * The path is then used to create the corresponding Word document.
    * @param {String} url The url of the document being transformed.
    * @param {HTMLDocument} document The document
    */

   generateDocumentPath: ({ document, url }) => {
    let { pathname } = new URL(url);
    console.log("Path Is ",pathname, url);
    return pathname.replace('.html', '');
   },
   /*
   generateDocumentPath: ({ document, url, html, params }) => {
     let { pathname } = new URL(url);
     const localFromURL = pathname.split('/')[1];
     if (!localFromURL.startsWith('resource')) {
       pathname = pathname.replace(localFromURL, window.local);
     }
     pathname.replace('.html', '');
     return pathname;
   },*/
}
