let schemeSearchTimer = null;
let schemeCache = [];
let schemeCacheLoaded = false;


/* =========================================================
   MF VISTA — SCHEME CATALOGUE
   ========================================================= */

async function loadSchemeCatalogue() {

    if (schemeCacheLoaded && schemeCache.length) {
        return schemeCache;
    }

    try {

        const response = await fetch(
            "/api/schemes?limit=200",
            {
                cache: "no-store"
            }
        );

        if (!response.ok) {
            throw new Error("Unable to load schemes");
        }

        const data = await response.json();

        schemeCache = Array.isArray(data.schemes)
            ? data.schemes
            : [];

        schemeCacheLoaded = true;

        return schemeCache;

    } catch (error) {

        console.error(
            "Scheme catalogue error:",
            error
        );

        return [];
    }
}


/* =========================================================
   SEARCH ALL FUNDS
   ========================================================= */

async function searchAllSchemes(query) {

    const box =
        document.getElementById("results");

    if (!box) return;

    query =
        String(query || "").trim();


    if (!query) {

        box.innerHTML = "";

        return;
    }


    /*
     * Show loading immediately.
     */

    box.innerHTML =
        '<div class="search-loading">Searching mutual funds…</div>';


    try {

        const response =
            await fetch(
                "/api/schemes?q=" +
                encodeURIComponent(query) +
                "&limit=40",
                {
                    cache: "no-store"
                }
            );


        if (!response.ok) {

            throw new Error(
                "Search failed"
            );
        }


        const data =
            await response.json();


        const schemes =
            Array.isArray(data.schemes)
                ? data.schemes
                : [];


        if (!schemes.length) {

            box.innerHTML =
                "<div>No matching fund found</div>";

            return;
        }


        box.innerHTML =
            schemes.map(
                scheme => {

                    const name =
                        escapeHtml(
                            scheme.schemeName
                        );

                    const code =
                        escapeHtml(
                            scheme.schemeCode
                        );

                    return `
                        <a
                            class="search-result-link"
                            href="${fundUrl(
                                scheme.schemeName,
                                scheme.schemeCode
                            )}"
                        >
                            <b>${name}</b>

                            <small>
                                Scheme code:
                                ${code}
                            </small>
                        </a>
                    `;
                }
            ).join("");


    } catch (error) {

        console.error(
            "Fund search error:",
            error
        );

        box.innerHTML =
            "<div>Search service is temporarily unavailable.</div>";
    }
}


/* =========================================================
   HTML SAFETY
   ========================================================= */

function escapeHtml(value) {

    return String(value)
        .replace(
            /[&<>"']/g,
            character => ({
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#039;"
            }[character])
        );
}


/* =========================================================
   FUND URL
   ========================================================= */

function fundUrl(
    name,
    schemeCode = ""
) {

    return (
        "/fund.html?name=" +
        encodeURIComponent(name) +
        "&code=" +
        encodeURIComponent(
            schemeCode
        )
    );
}


/* =========================================================
   SEARCH INPUT
   ========================================================= */

document
    .getElementById("search")
    ?.addEventListener(
        "input",
        event => {

            clearTimeout(
                schemeSearchTimer
            );

            schemeSearchTimer =
                setTimeout(
                    () =>
                        searchAllSchemes(
                            event.target.value
                        ),
                    250
                );
        }
    );


/* =========================================================
   HERO SEARCH
   ========================================================= */

function runHeroSearch() {

    const query =
        document
            .getElementById(
                "heroSearch"
            )
            ?.value || "";


    const search =
        document.getElementById(
            "search"
        );


    if (!search) return;


    search.value = query;

    searchAllSchemes(
        query
    );

    search.focus();
}


/* =========================================================
   POPULAR FUNDS
   =========================================================
   
   IMPORTANT:
   The API catalogue contains all schemes.
   For the homepage we still need a curated section.
   
   These are ONLY display examples.
   They are not used as the master database.
   ========================================================= */

const popularFunds = [

    {
        name:
            "ICICI Prudential Flexicap Fund",
        category:
            "Flexi Cap"
    },

    {
        name:
            "Parag Parikh Flexi Cap Fund",
        category:
            "Flexi Cap"
    },

    {
        name:
            "HDFC Flexi Cap Fund",
        category:
            "Flexi Cap"
    },

    {
        name:
            "ICICI Prudential Bluechip Fund",
        category:
            "Large Cap"
    },

    {
        name:
            "HDFC Mid-Cap Opportunities Fund",
        category:
            "Mid Cap"
    },

    {
        name:
            "Nippon India Small Cap Fund",
        category:
            "Small Cap"
    },

    {
        name:
            "ICICI Prudential Balanced Advantage Fund",
        category:
            "Hybrid"
    },

    {
        name:
            "SBI Balanced Advantage Fund",
        category:
            "Hybrid"
    }

];


/* =========================================================
   RENDER POPULAR FUNDS
   ========================================================= */

function renderFunds(
    list = popularFunds
) {

    const grid =
        document.getElementById(
            "fundGrid"
        );

    if (!grid) return;


    grid.innerHTML =
        list.map(
            fund => {

                return `
                    <a
                        class="fund fund-link"
                        href="${fundUrl(
                            fund.name
                        )}"
                    >

                        <small>
                            Mutual Fund
                            ·
                            ${escapeHtml(
                                fund.category
                            )}
                        </small>

                        <h3>
                            ${escapeHtml(
                                fund.name
                            )}
                        </h3>

                        <div class="return">

                            <div>

                                <small>
                                    View fund
                                </small>

                                <b>
                                    →
                                </b>

                            </div>

                        </div>

                    </a>
                `;
            }
        ).join("");
}


renderFunds();


/* =========================================================
   COMPARE FUND SELECTORS
   ========================================================= */

async function fillSelects() {

    const schemes =
        await loadSchemeCatalogue();


    const first =
        document.getElementById(
            "fundA"
        );

    const second =
        document.getElementById(
            "fundB"
        );


    if (!first || !second) {
        return;
    }


    const options =
        schemes
            .slice(0, 500)
            .map(
                scheme => `
                    <option
                        value="${escapeHtml(
                            scheme.schemeCode
                        )}"
                    >
                        ${escapeHtml(
                            scheme.schemeName
                        )}
                    </option>
                `
            )
            .join("");


    first.innerHTML =
        options;

    second.innerHTML =
        options;


    if (schemes.length > 1) {

        second.selectedIndex = 1;
    }
}


fillSelects();


/* =========================================================
   COMPARE FUNDS
   ========================================================= */

async function compareFunds() {

    const codeA =
        document
            .getElementById(
                "fundA"
            )
            ?.value;


    const codeB =
        document
            .getElementById(
                "fundB"
            )
            ?.value;


    const output =
        document.getElementById(
            "comparison"
        );


    if (!output) return;


    if (!codeA || !codeB) {

        output.innerHTML =
            "<p>Please select two funds.</p>";

        return;
    }


    output.innerHTML =
        "<p>Loading fund comparison…</p>";


    try {

        const [
            responseA,
            responseB
        ] = await Promise.all([

            fetch(
                "/api/fund?code=" +
                encodeURIComponent(
                    codeA
                )
            ),

            fetch(
                "/api/fund?code=" +
                encodeURIComponent(
                    codeB
                )
            )

        ]);


        if (
            !responseA.ok ||
            !responseB.ok
        ) {

            throw new Error(
                "Unable to load funds"
            );
        }


        const [
            fundA,
            fundB
        ] = await Promise.all([

            responseA.json(),
            responseB.json()

        ]);


        output.innerHTML = `

            <div class="comparetable">

                <table>

                    <tr>
                        <td>Metric</td>
                        <td>
                            ${escapeHtml(
                                fundA.schemeName
                            )}
                        </td>
                        <td>
                            ${escapeHtml(
                                fundB.schemeName
                            )}
                        </td>
                    </tr>


                    <tr>
                        <td>Latest NAV</td>

                        <td>
                            ₹${formatNumber(
                                fundA.nav?.latest
                            )}
                        </td>

                        <td>
                            ₹${formatNumber(
                                fundB.nav?.latest
                            )}
                        </td>
                    </tr>


                    <tr>
                        <td>1Y Return</td>

                        <td>
                            ${formatReturn(
                                fundA.returns?.["1Y"]
                            )}
                        </td>

                        <td>
                            ${formatReturn(
                                fundB.returns?.["1Y"]
                            )}
                        </td>
                    </tr>


                    <tr>
                        <td>3Y CAGR</td>

                        <td>
                            ${formatReturn(
                                fundA.returns?.["3Y"]
                            )}
                        </td>

                        <td>
                            ${formatReturn(
                                fundB.returns?.["3Y"]
                            )}
                        </td>
                    </tr>


                    <tr>
                        <td>5Y CAGR</td>

                        <td>
                            ${formatReturn(
                                fundA.returns?.["5Y"]
                            )}
                        </td>

                        <td>
                            ${formatReturn(
                                fundB.returns?.["5Y"]
                            )}
                        </td>
                    </tr>


                    <tr>
                        <td>10Y CAGR</td>

                        <td>
                            ${formatReturn(
                                fundA.returns?.["10Y"]
                            )}
                        </td>

                        <td>
                            ${formatReturn(
                                fundB.returns?.["10Y"]
                            )}
                        </td>
                    </tr>


                    <tr>
                        <td>Volatility</td>

                        <td>
                            ${formatReturn(
                                fundA.riskMetrics?.volatility,
                                "%"
                            )}
                        </td>

                        <td>
                            ${formatReturn(
                                fundB.riskMetrics?.volatility,
                                "%"
                            )}
                        </td>
                    </tr>


                    <tr>
                        <td>Max Drawdown</td>

                        <td>
                            ${formatReturn(
                                fundA.riskMetrics?.maxDrawdown,
                                "%"
                            )}
                        </td>

                        <td>
                            ${formatReturn(
                                fundB.riskMetrics?.maxDrawdown,
                                "%"
                            )}
                        </td>
                    </tr>

                </table>

            </div>
        `;


    } catch (error) {

        console.error(
            "Compare error:",
            error
        );

        output.innerHTML =
            "<p>Unable to load comparison. Please try again.</p>";
    }
}


/* =========================================================
   FORMAT HELPERS
   ========================================================= */

function formatNumber(
    value
) {

    const number =
        Number(value);


    if (!Number.isFinite(number)) {
        return "—";
    }


    return number.toFixed(2);
}


function formatReturn(
    value,
    suffix = "%"
) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return "—";
    }


    const number =
        Number(value);


    if (!Number.isFinite(number)) {

        return "—";
    }


    return (
        number.toFixed(2) +
        suffix
    );
}


/* =========================================================
   SIP CALCULATOR
   ========================================================= */

function sipCalc() {

    const principal =
        Number(
            document
                .getElementById(
                    "sip"
                )
                ?.value || 0
        );


    const annualRate =
        Number(
            document
                .getElementById(
                    "rate"
                )
                ?.value || 0
        );


    const years =
        Number(
            document
                .getElementById(
                    "years"
                )
                ?.value || 0
        );


    const monthlyRate =
        annualRate /
        1200;


    const months =
        years * 12;


    let futureValue;


    if (
        monthlyRate > 0 &&
        months > 0
    ) {

        futureValue =
            principal *
            (
                (
                    Math.pow(
                        1 +
                        monthlyRate,
                        months
                    ) -
                    1
                ) /
                monthlyRate
            ) *
            (1 + monthlyRate);

    } else {

        futureValue =
            principal *
            months;
    }


    const output =
        document.getElementById(
            "sipOut"
        );


    if (output) {

        output.textContent =
            "₹" +
            (
                futureValue /
                100000
            ).toFixed(2) +
            " Lakh";
    }
         }
