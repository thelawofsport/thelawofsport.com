// Shared Key Dates widget — edit this file to update both the Home and How To pages
(function () {
    var dates = [
        { month: 'Jul', day: '28', title: 'Tutorial 1: Intro to Sports Law',           type: 'Tutorial',    assessment: false },
        { month: 'Aug', day: '4',  title: 'Tutorial 2: Governance',                    type: 'Tutorial',    assessment: false },
        { month: 'Aug', day: '11', title: 'Tutorial 3: Discipline &amp; Disputes',     type: 'Tutorial',    assessment: false },
        { month: 'Oct', day: '20', title: 'Assessment 2: Take Home Paper Release',      type: 'Assessment',  assessment: true  },
        { month: 'Sep', day: 'TBD', title: 'Assessment 3: Plea Assessment',            type: 'Assessment',  assessment: true  },
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
