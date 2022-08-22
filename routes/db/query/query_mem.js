var queries = {};

/////////////////////////////////////////////////
// scheduler.js
/////////////////////////////////////////////////
queries.create_url_list = () => {
    return `CREATE TABLE IF NOT EXISTS MEM_CRAWL_URL_LIST(
    seq_no integer primary key autoincrement,
    board_no integer not null,
    url text not null)`;
};

queries.insert_url_id_list = (board_no, url) => {
    return `INSERT INTO MEM_CRAWL_URL_LIST VALUES(NULL, ${board_no}, '${url}')`;
};

/////////////////////////////////////////////////
// scrap.js
/////////////////////////////////////////////////
queries.select_url_to_scrap = (board_no) => {
    return `SELECT * FROM MEM_CRAWL_URL_LIST WHERE board_no = ${board_no} ORDER BY seq_no desc LIMIT 1`;
};

queries.delete_url = (url) => {
    return `DELETE FROM MEM_CRAWL_URL_LIST WHERE url = '${url}'`;
};

module.exports = queries;
