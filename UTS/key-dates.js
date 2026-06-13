// Shared Key Dates widget — edit this file to update both the Home and How To pages
(function () {
    var dates = [
        { month: 'Jul', day: '28',  title: 'Tutorial 1: Intro to Sports Law (Week 1 — Welcome Module)',      type: 'Tutorial',    assessment: false },
        { month: 'Sep', day: 'TBD', title: 'Assessment 1: Seminar Presentation',                             type: 'Assessment',  assessment: true  },
        { month: 'Sep', day: '8',   title: 'Assessment 3A &amp; 3B: Plea of Mitigation (Weeks 7–8)',         type: 'Assessment',  assessment: true  },
        { month: 'Oct', day: '20',  title: 'Assessment 2: Contract Review — Take Home Paper Released',       type: 'Assessment',  assessment: true  },
    ];

    var html = '<h3>Key Dates</h3>';
    dates.forEach(function (d) {
        html +=
            '<div class="calendar-item">' +
              '<div class="cal-date">' +
                '<span class="cal-month">' + d.month + '</span>' +
                '<span class="cal-day">'  + d.day   + '</span>' +
              '</div>' +
              '<div class="cal-info">' +
                '<div class="cal-title">' + d.title + '</div>' +
                '<div class="cal-type' + (d.assessment ? ' assessment' : '') + '">' + d.type + '</div>' +
              '</div>' +
            '</div>';
    });

    document.querySelectorAll('.key-dates-widget').forEach(function (el) {
        el.innerHTML = html;
    });
})();
