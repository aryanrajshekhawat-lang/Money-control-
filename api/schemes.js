// GET /api/schemes
//
// Examples:
//
// /api/schemes
// /api/schemes?q=flexicap
// /api/schemes?q=icici&limit=50
// /api/schemes?category=equity
//
// Full mutual-fund catalogue powered by MFAPI.

export default async function handler(req, res) {

  const q = String(
    req.query.q || ""
  )
    .trim()
    .toLowerCase();

  const category = String(
    req.query.category || ""
  )
    .trim()
    .toLowerCase();

  const limit = Math.min(
    Math.max(
      Number(req.query.limit || 50),
      10
    ),
    200
  );

  const offset = Math.max(
    Number(req.query.offset || 0),
    0
  );


  try {

    /*
     * ------------------------------------
     * FETCH FULL CATALOGUE
     * ------------------------------------
     */

    const response = await fetch(
      "https://api.mfapi.in/mf",
      {
        headers: {
          Accept: "application/json",
        },
      }
    );


    if (!response.ok) {

      return res.status(502).json({
        error:
          "Scheme catalogue unavailable",
      });
    }


    const raw =
      await response.json();


    const catalogue =
      Array.isArray(raw)
        ? raw
        : [];


    /*
     * ------------------------------------
     * NORMALISE
     * ------------------------------------
     */

    let schemes =
      catalogue
        .map((scheme) => ({

          schemeCode:
            String(
              scheme.schemeCode || ""
            ),

          schemeName:
            String(
              scheme.schemeName || ""
            ).trim(),

          category:
            scheme.schemeCategory ||
            scheme.category ||
            null,

        }))

        .filter(
          (scheme) =>
            scheme.schemeCode &&
            scheme.schemeName
        );


    /*
     * ------------------------------------
     * CATEGORY FILTER
     * ------------------------------------
     */

    if (category) {

      schemes =
        schemes.filter(
          (scheme) =>
            String(
              scheme.category || ""
            )
              .toLowerCase()
              .includes(category)
        );
    }


    /*
     * ------------------------------------
     * SEARCH
     * ------------------------------------
     */

    if (q) {

      schemes =
        schemes.filter(
          (scheme) => {

            const name =
              scheme.schemeName
                .toLowerCase();

            const code =
              scheme.schemeCode
                .toLowerCase();

            return (
              name.includes(q) ||
              code.includes(q)
            );
          }
        );


      /*
       * Relevance ranking:
       *
       * 4 = exact match
       * 3 = starts with query
       * 2 = word starts with query
       * 1 = contains query
       */

      schemes.sort(
        (a, b) => {

          const scoreA =
            getSearchScore(
              a,
              q
            );

          const scoreB =
            getSearchScore(
              b,
              q
            );

          if (
            scoreA !==
            scoreB
          ) {

            return (
              scoreB -
              scoreA
            );
          }

          return a.schemeName.localeCompare(
            b.schemeName
          );
        }
      );

    } else {

      /*
       * No search:
       * alphabetical order
       */

      schemes.sort(
        (a, b) =>
          a.schemeName.localeCompare(
            b.schemeName
          )
      );
    }


    /*
     * ------------------------------------
     * PAGINATION
     * ------------------------------------
     */

    const total =
      schemes.length;

    const paginated =
      schemes.slice(
        offset,
        offset + limit
      );


    /*
     * ------------------------------------
     * RESPONSE
     * ------------------------------------
     */

    res.setHeader(
      "Cache-Control",
      "s-maxage=86400, stale-while-revalidate=604800"
    );

    res.setHeader(
      "Access-Control-Allow-Origin",
      "*"
    );


    return res.status(200).json({

      success: true,

      query: q || null,

      category:
        category || null,

      total,

      offset,

      limit,

      hasMore:
        offset + limit < total,

      schemes:
        paginated,

    });


  } catch (error) {

    console.error(
      "Scheme catalogue error:",
      error
    );


    return res.status(500).json({

      success: false,

      error:
        "Unable to load scheme catalogue",

    });
  }
}


/*
 * ----------------------------------------
 * SEARCH RELEVANCE
 * ----------------------------------------
 */

function getSearchScore(
  scheme,
  query
) {

  const name =
    scheme.schemeName
      .toLowerCase();

  const code =
    scheme.schemeCode
      .toLowerCase();


  if (name === query) {

    return 4;
  }


  if (name.startsWith(query)) {

    return 3;
  }


  const words =
    name.split(
      /[\s\-\/]+/
    );


  if (
    words.some(
      (word) =>
        word.startsWith(query)
    )
  ) {

    return 2;
  }


  if (
    code === query
  ) {

    return 3;
  }


  return 1;
}
