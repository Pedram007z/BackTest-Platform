/** The shape ForexFactory embeds in its calendar page (trimmed). */
export const FF_PAGE = `<!DOCTYPE html><html><head><title>Forex Calendar</title></head><body>
<script>
window.calendarComponentStates = window.calendarComponentStates || [];
window.calendarComponentStates[1] = {
    days: [{"date":"Sun <span>Jan 7<\\/span>","dateline":1704603600,"add":"","events":[]},
           {"date":"Mon <span>Jan 8<\\/span>","dateline":1704690000,"events":[
             {"id":131406,"ebaseId":41,"name":"Bank Holiday","dateline":1704690000,"country":"JN","currency":"JPY","impactName":"holiday","impactClass":"icon--ff-impact-gra","timeLabel":"All Day","actual":"","forecast":"","previous":""},
             {"id":131407,"name":"German Industrial Production m\\/m","dateline":1704697200,"currency":"EUR","impactName":"low","timeLabel":"2:00am","actual":"-0.7%","forecast":"-0.3%","previous":"-0.4%"}
           ]},
           {"date":"Fri <span>Jan 12<\\/span>","dateline":1705035600,"events":[
             {"id":131500,"name":"CPI m\\/m","dateline":1704893400,"currency":"USD","impactName":"high","timeLabel":"8:30am","actual":"0.3%","forecast":"0.2%","previous":"0.1%"},
             {"id":131501,"name":"Fed Speaks","dateline":1704900600,"currency":"USD","impactName":"non-economic","timeLabel":"10:30am"},
             {"id":131502,"name":"Oddly \\"quoted\\" [title]","dateline":1704904200,"currency":"GBP","impactClass":"icon--ff-impact-ora","timeLabel":"11:30am","actual":"","forecast":"1.2","previous":"1.1"}
           ]}],
    time: 1704700000,
    settings: {"timezone":"America\\/New_York"}
};
</script></body></html>`;
